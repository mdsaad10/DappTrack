module dapptrack_addr::dapptrack_v2 {
    use std::string::String;
    use std::signer;
    use std::vector;
    use aptos_framework::timestamp;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;

    // Error codes
    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_ORGANIZATION_NOT_FOUND: u64 = 3;
    const E_PROJECT_NOT_FOUND: u64 = 4;
    const E_UNAUTHORIZED: u64 = 5;
    const E_INSUFFICIENT_FUNDS: u64 = 6;
    const E_INVALID_PROJECT_STATUS: u64 = 7;

    // Project status constants
    const PROJECT_STATUS_ACTIVE: u8 = 1;
    const PROJECT_STATUS_COMPLETED: u8 = 2;
    const PROJECT_STATUS_CANCELLED: u8 = 3;

    // Data structures
    struct Organization has store, copy, drop {
        id: u64,
        name: String,
        description: String,
        admin: address,
        wallet_balance: u64,
        total_received: u64,
        total_spent: u64,
        created_at: u64,
        ipfs_metadata: String
    }

    struct Project has store, copy, drop {
        id: u64,
        org_id: u64,
        name: String,
        description: String,
        target_amount: u64,
        raised_amount: u64,
        spent_amount: u64,
        status: u8,
        created_at: u64
    }

    struct Donation has store, copy, drop {
        id: u64,
        org_id: u64,
        project_id: u64,
        donor: address,
        amount: u64,
        message: String,
        donated_at: u64
    }

    struct Expense has store, copy, drop {
        id: u64,
        org_id: u64,
        project_id: u64,
        description: String,
        amount: u64,
        ipfs_proof: String,
        spent_by: address,
        spent_at: u64
    }

    struct DappTrackRegistry has key {
        organizations: vector<Organization>,
        projects: vector<Project>,
        donations: vector<Donation>,
        expenses: vector<Expense>,
        next_org_id: u64,
        next_project_id: u64,
        next_donation_id: u64,
        next_expense_id: u64
    }

    // Initialize the module
    fun init_module(account: &signer) {
        let account_addr = signer::address_of(account);
        assert!(!exists<DappTrackRegistry>(account_addr), E_ALREADY_INITIALIZED);

        move_to(account, DappTrackRegistry {
            organizations: vector::empty<Organization>(),
            projects: vector::empty<Project>(),
            donations: vector::empty<Donation>(),
            expenses: vector::empty<Expense>(),
            next_org_id: 1,
            next_project_id: 1,
            next_donation_id: 1,
            next_expense_id: 1,
        });
    }

    // Helper function to find organization by ID
    fun find_org_by_id(organizations: &mut vector<Organization>, org_id: u64): &mut Organization {
        let len = vector::length(organizations);
        let i = 0;
        while (i < len) {
            let org = vector::borrow_mut(organizations, i);
            if (org.id == org_id) {
                return org
            };
            i = i + 1;
        };
        abort E_ORGANIZATION_NOT_FOUND
    }

    // Helper function to find project by ID
    fun find_project_by_id(projects: &mut vector<Project>, project_id: u64): &mut Project {
        let len = vector::length(projects);
        let i = 0;
        while (i < len) {
            let project = vector::borrow_mut(projects, i);
            if (project.id == project_id) {
                return project
            };
            i = i + 1;
        };
        abort E_PROJECT_NOT_FOUND
    }

    // Register a new organization
    public entry fun register_organization(
        admin: &signer,
        name: String,
        description: String,
        ipfs_metadata: String,
    ) acquires DappTrackRegistry {
        let registry = borrow_global_mut<DappTrackRegistry>(@dapptrack_addr);
        let org_id = registry.next_org_id;

        let organization = Organization {
            id: org_id,
            name,
            description,
            admin: signer::address_of(admin),
            wallet_balance: 0,
            total_received: 0,
            total_spent: 0,
            created_at: timestamp::now_seconds(),
            ipfs_metadata,
        };

        vector::push_back(&mut registry.organizations, organization);
        registry.next_org_id = org_id + 1;
    }

    // Create a new project for an organization
    public entry fun create_project(
        admin: &signer,
        org_id: u64,
        name: String,
        description: String,
        target_amount: u64,
    ) acquires DappTrackRegistry {
        let registry = borrow_global_mut<DappTrackRegistry>(@dapptrack_addr);
        let admin_addr = signer::address_of(admin);

        // Verify admin authorization
        let org = find_org_by_id(&mut registry.organizations, org_id);
        assert!(org.admin == admin_addr, E_UNAUTHORIZED);

        let project_id = registry.next_project_id;

        let project = Project {
            id: project_id,
            org_id,
            name,
            description,
            target_amount,
            raised_amount: 0,
            spent_amount: 0,
            status: PROJECT_STATUS_ACTIVE,
            created_at: timestamp::now_seconds(),
        };

        vector::push_back(&mut registry.projects, project);
        registry.next_project_id = project_id + 1;
    }

    // Donate to an organization and project
    public entry fun donate_to_organization(
        donor: &signer,
        org_id: u64,
        project_id: u64,
        amount: u64,
        message: String,
    ) acquires DappTrackRegistry {
        let registry = borrow_global_mut<DappTrackRegistry>(@dapptrack_addr);

        // Find organization and project
        let org = find_org_by_id(&mut registry.organizations, org_id);
        let project = find_project_by_id(&mut registry.projects, project_id);

        // Verify project belongs to organization
        assert!(project.org_id == org_id, E_PROJECT_NOT_FOUND);

        // Get admin address before transferring
        let org_admin = org.admin;

        // Transfer APT to organization admin wallet
        coin::transfer<AptosCoin>(donor, org_admin, amount);

        // Update organization balances
        org.wallet_balance = org.wallet_balance + amount;
        org.total_received = org.total_received + amount;

        // Update project raised amount
        project.raised_amount = project.raised_amount + amount;

        // Create donation record
        let donation_id = registry.next_donation_id;
        let donation = Donation {
            id: donation_id,
            org_id,
            project_id,
            donor: signer::address_of(donor),
            amount,
            message,
            donated_at: timestamp::now_seconds(),
        };

        vector::push_back(&mut registry.donations, donation);
        registry.next_donation_id = donation_id + 1;
    }

    // Record an expense for a project
    public entry fun record_expense(
        admin: &signer,
        org_id: u64,
        project_id: u64,
        description: String,
        amount: u64,
        ipfs_proof: String,
    ) acquires DappTrackRegistry {
        let registry = borrow_global_mut<DappTrackRegistry>(@dapptrack_addr);
        let admin_addr = signer::address_of(admin);

        // Verify admin authorization
        let org = find_org_by_id(&mut registry.organizations, org_id);
        assert!(org.admin == admin_addr, E_UNAUTHORIZED);

        // Verify sufficient funds
        assert!(org.wallet_balance >= amount, E_INSUFFICIENT_FUNDS);

        // Find project
        let project = find_project_by_id(&mut registry.projects, project_id);
        assert!(project.org_id == org_id, E_PROJECT_NOT_FOUND);

        // Update balances
        org.wallet_balance = org.wallet_balance - amount;
        org.total_spent = org.total_spent + amount;
        project.spent_amount = project.spent_amount + amount;

        // Create expense record
        let expense_id = registry.next_expense_id;
        let expense = Expense {
            id: expense_id,
            org_id,
            project_id,
            description,
            amount,
            ipfs_proof,
            spent_by: admin_addr,
            spent_at: timestamp::now_seconds(),
        };

        vector::push_back(&mut registry.expenses, expense);
        registry.next_expense_id = expense_id + 1;
    }

    // View functions
    #[view]
    public fun get_all_organizations(): vector<Organization> acquires DappTrackRegistry {
        let registry = borrow_global<DappTrackRegistry>(@dapptrack_addr);
        registry.organizations
    }

    #[view]
    public fun get_organization_by_id(org_id: u64): Organization acquires DappTrackRegistry {
        let registry = borrow_global<DappTrackRegistry>(@dapptrack_addr);
        let organizations = &registry.organizations;
        let len = vector::length(organizations);
        let i = 0;
        while (i < len) {
            let org = vector::borrow(organizations, i);
            if (org.id == org_id) {
                return *org
            };
            i = i + 1;
        };
        abort E_ORGANIZATION_NOT_FOUND
    }

    #[view]
    public fun get_projects_by_org(org_id: u64): vector<Project> acquires DappTrackRegistry {
        let registry = borrow_global<DappTrackRegistry>(@dapptrack_addr);
        let all_projects = &registry.projects;
        let result = vector::empty<Project>();
        let len = vector::length(all_projects);
        let i = 0;
        while (i < len) {
            let project = vector::borrow(all_projects, i);
            if (project.org_id == org_id) {
                vector::push_back(&mut result, *project);
            };
            i = i + 1;
        };
        result
    }

    #[view]
    public fun get_donations_by_org(org_id: u64): vector<Donation> acquires DappTrackRegistry {
        let registry = borrow_global<DappTrackRegistry>(@dapptrack_addr);
        let all_donations = &registry.donations;
        let result = vector::empty<Donation>();
        let len = vector::length(all_donations);
        let i = 0;
        while (i < len) {
            let donation = vector::borrow(all_donations, i);
            if (donation.org_id == org_id) {
                vector::push_back(&mut result, *donation);
            };
            i = i + 1;
        };
        result
    }

    #[view]
    public fun get_expenses_by_org(org_id: u64): vector<Expense> acquires DappTrackRegistry {
        let registry = borrow_global<DappTrackRegistry>(@dapptrack_addr);
        let all_expenses = &registry.expenses;
        let result = vector::empty<Expense>();
        let len = vector::length(all_expenses);
        let i = 0;
        while (i < len) {
            let expense = vector::borrow(all_expenses, i);
            if (expense.org_id == org_id) {
                vector::push_back(&mut result, *expense);
            };
            i = i + 1;
        };
        result
    }
}
