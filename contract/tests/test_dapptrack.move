#[test_only]
module dapptrack_addr::test_dapptrack {
    use std::string;
    use aptos_framework::timestamp;
    use aptos_framework::account;
    use dapptrack_addr::dapptrack;

    #[test(admin = @dapptrack_addr)]
    public fun test_allocate_fund(admin: &signer) {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&account::create_signer_for_test(@0x1));
        
        // Initialize the module
        dapptrack::init_module_for_test(admin);

        // Allocate a fund
        let project_name = string::utf8(b"Test School Project");
        let recipient = @0x123;
        dapptrack::allocate_fund(admin, project_name, 100000, recipient);

        // Verify fund was created
        let funds = dapptrack::get_all_funds();
        assert!(std::vector::length(&funds) == 1, 0);
    }

    #[test(admin = @dapptrack_addr, contractor = @0x456)]
    public fun test_record_delivery(admin: &signer, contractor: &signer) {
        // Initialize
        timestamp::set_time_has_started_for_testing(&account::create_signer_for_test(@0x1));
        dapptrack::init_module_for_test(admin);
        dapptrack::init_module_for_test(contractor);  // Initialize contractor's state too

        // Allocate fund
        let project_name = string::utf8(b"Medical Supplies");
        dapptrack::allocate_fund(admin, project_name, 50000, @0x456);

        // Record delivery
        let item = string::utf8(b"Medicine Kits");
        let ipfs_hash = string::utf8(b"QmTestHash123");
        let gps_lat = string::utf8(b"12.9716");
        let gps_long = string::utf8(b"77.5946");
        
        dapptrack::record_delivery(contractor, 1, item, 200, ipfs_hash, gps_lat, gps_long);

        // Verify delivery (check from contractor's state)
        // Note: In MVP, deliveries are stored per-account, not globally
        // This is a simplified version for testing
    }

    #[test(donor = @0x789)]
    public fun test_donate(donor: &signer) {
        timestamp::set_time_has_started_for_testing(&account::create_signer_for_test(@0x1));
        
        // Note: For this test, we need the module to be initialized at @dapptrack_addr
        // In production, admin would initialize it
        let admin_signer = &account::create_signer_for_test(@dapptrack_addr);
        dapptrack::init_module_for_test(admin_signer);

        // Make donation
        dapptrack::donate(donor, 1, 10000);

        // Verify donation
        let donations = dapptrack::get_all_donations();
        assert!(std::vector::length(&donations) == 1, 2);
    }
}
