module dapptrack_addr::dapptrack {
    use std::string::{Self, String};
    use std::signer;
    use std::vector;
    use aptos_framework::event;
    use aptos_framework::timestamp;

    // ======================== Errors ========================
    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_FUND_NOT_FOUND: u64 = 3;
    const E_UNAUTHORIZED: u64 = 4;
    const E_INVALID_STATUS: u64 = 5;
    const E_DELIVERY_NOT_FOUND: u64 = 6;
    const E_DONATION_NOT_FOUND: u64 = 7;
    const E_INVALID_GPS: u64 = 8;

    // Fund status constants
    const STATUS_ALLOCATED: u8 = 0;
    const STATUS_DISBURSED: u8 = 1;
    const STATUS_SPENT: u8 = 2;
    const STATUS_VERIFIED: u8 = 3;

    // ======================== Structs ========================

    struct FundAllocation has store, copy, drop {
        id: u64,
        project_name: String,
        amount: u64,
        allocated_to: address,
        allocated_by: address,
        allocated_at: u64,
        status: u8
    }

    struct ResourceDelivery has store, copy, drop {
        id: u64,
        fund_id: u64,
        item_type: String,
        quantity: u64,
        ipfs_proof_hash: String,
        gps_lat: String,
        gps_long: String,
        delivered_by: address,
        delivered_at: u64,
        verified: bool,
        verification_count: u64
    }

    struct Donation has store, copy, drop {
        id: u64,
        donor: address,
        amount: u64,
        project_id: u64,
        linked_delivery_ids: vector<u64>,
        donated_at: u64
    }

    // Global storage
    struct DappTrackState has key {
        funds: vector<FundAllocation>,
        deliveries: vector<ResourceDelivery>,
        donations: vector<Donation>,
        next_fund_id: u64,
        next_delivery_id: u64,
        next_donation_id: u64
    }

    // ======================== Events ========================

    #[event]
    struct FundAllocated has drop, store {
        fund_id: u64,
        project_name: String,
        amount: u64,
        allocated_to: address,
        allocated_by: address,
        timestamp: u64
    }

    #[event]
    struct FundDisbursed has drop, store {
        fund_id: u64,
        disbursed_by: address,
        timestamp: u64
    }

    #[event]
    struct DeliveryRecorded has drop, store {
        delivery_id: u64,
        fund_id: u64,
        item_type: String,
        quantity: u64,
        ipfs_hash: String,
        delivered_by: address,
        timestamp: u64
    }

    #[event]
    struct DonationReceived has drop, store {
        donation_id: u64,
        donor: address,
        amount: u64,
        project_id: u64,
        timestamp: u64
    }

    #[event]
    struct DeliveryVerified has drop, store {
        delivery_id: u64,
        verified_by: address,
        timestamp: u64
    }

    #[event]
    struct DonationLinked has drop, store {
        donation_id: u64,
        delivery_id: u64,
        timestamp: u64
    }

    // ======================== Initialize ========================

    fun init_module(account: &signer) {
        let account_addr = signer::address_of(account);
        
        if (!exists<DappTrackState>(account_addr)) {
            move_to(account, DappTrackState {
                funds: vector::empty<FundAllocation>(),
                deliveries: vector::empty<ResourceDelivery>(),
                donations: vector::empty<Donation>(),
                next_fund_id: 1,
                next_delivery_id: 1,
                next_donation_id: 1
            });
        };
    }

    // ======================== Write Functions ========================

    public entry fun allocate_fund(
        account: &signer,
        project_name: String,
        amount: u64,
        recipient: address
    ) acquires DappTrackState {
        let account_addr = signer::address_of(account);
        assert!(exists<DappTrackState>(account_addr), E_NOT_INITIALIZED);

        let state = borrow_global_mut<DappTrackState>(account_addr);
        let fund_id = state.next_fund_id;

        let fund = FundAllocation {
            id: fund_id,
            project_name,
            amount,
            allocated_to: recipient,
            allocated_by: account_addr,
            allocated_at: timestamp::now_seconds(),
            status: STATUS_ALLOCATED
        };

        vector::push_back(&mut state.funds, fund);
        state.next_fund_id = fund_id + 1;

        event::emit(FundAllocated {
            fund_id,
            project_name,
            amount,
            allocated_to: recipient,
            allocated_by: account_addr,
            timestamp: timestamp::now_seconds()
        });
    }

    public entry fun disburse_fund(
        account: &signer,
        fund_id: u64
    ) acquires DappTrackState {
        let account_addr = signer::address_of(account);
        assert!(exists<DappTrackState>(account_addr), E_NOT_INITIALIZED);

        let state = borrow_global_mut<DappTrackState>(account_addr);
        let funds_len = vector::length(&state.funds);
        let i = 0;
        let found = false;

        while (i < funds_len) {
            let fund = vector::borrow_mut(&mut state.funds, i);
            if (fund.id == fund_id) {
                assert!(fund.allocated_to == account_addr || fund.allocated_by == account_addr, E_UNAUTHORIZED);
                assert!(fund.status == STATUS_ALLOCATED, E_INVALID_STATUS);
                
                fund.status = STATUS_DISBURSED;
                found = true;
                break
            };
            i = i + 1;
        };

        assert!(found, E_FUND_NOT_FOUND);

        event::emit(FundDisbursed {
            fund_id,
            disbursed_by: account_addr,
            timestamp: timestamp::now_seconds()
        });
    }

    public entry fun record_delivery(
        account: &signer,
        fund_id: u64,
        item_type: String,
        quantity: u64,
        ipfs_hash: String,
        gps_lat: String,
        gps_long: String
    ) acquires DappTrackState {
        let account_addr = signer::address_of(account);
        assert!(exists<DappTrackState>(account_addr), E_NOT_INITIALIZED);

        assert!(string::length(&gps_lat) > 0, E_INVALID_GPS);
        assert!(string::length(&gps_long) > 0, E_INVALID_GPS);

        let state = borrow_global_mut<DappTrackState>(account_addr);
        let delivery_id = state.next_delivery_id;

        let delivery = ResourceDelivery {
            id: delivery_id,
            fund_id,
            item_type,
            quantity,
            ipfs_proof_hash: ipfs_hash,
            gps_lat,
            gps_long,
            delivered_by: account_addr,
            delivered_at: timestamp::now_seconds(),
            verified: false,
            verification_count: 0
        };

        vector::push_back(&mut state.deliveries, delivery);
        state.next_delivery_id = delivery_id + 1;

        event::emit(DeliveryRecorded {
            delivery_id,
            fund_id,
            item_type,
            quantity,
            ipfs_hash,
            delivered_by: account_addr,
            timestamp: timestamp::now_seconds()
        });
    }

    public entry fun donate(
        donor: &signer,
        project_id: u64,
        amount: u64
    ) acquires DappTrackState {
        let donor_addr = signer::address_of(donor);
        
        assert!(exists<DappTrackState>(@dapptrack_addr), E_NOT_INITIALIZED);

        let state = borrow_global_mut<DappTrackState>(@dapptrack_addr);
        let donation_id = state.next_donation_id;

        let donation = Donation {
            id: donation_id,
            donor: donor_addr,
            amount,
            project_id,
            linked_delivery_ids: vector::empty<u64>(),
            donated_at: timestamp::now_seconds()
        };

        vector::push_back(&mut state.donations, donation);
        state.next_donation_id = donation_id + 1;

        event::emit(DonationReceived {
            donation_id,
            donor: donor_addr,
            amount,
            project_id,
            timestamp: timestamp::now_seconds()
        });
    }

    public entry fun verify_delivery(
        account: &signer,
        delivery_id: u64
    ) acquires DappTrackState {
        let account_addr = signer::address_of(account);
        assert!(exists<DappTrackState>(@dapptrack_addr), E_NOT_INITIALIZED);

        let state = borrow_global_mut<DappTrackState>(@dapptrack_addr);
        let deliveries_len = vector::length(&state.deliveries);
        let i = 0;
        let found = false;

        while (i < deliveries_len) {
            let delivery = vector::borrow_mut(&mut state.deliveries, i);
            if (delivery.id == delivery_id) {
                delivery.verified = true;
                delivery.verification_count = delivery.verification_count + 1;
                found = true;
                break
            };
            i = i + 1;
        };

        assert!(found, E_DELIVERY_NOT_FOUND);

        event::emit(DeliveryVerified {
            delivery_id,
            verified_by: account_addr,
            timestamp: timestamp::now_seconds()
        });
    }

    public entry fun link_donation_to_delivery(
        account: &signer,
        donation_id: u64,
        delivery_id: u64
    ) acquires DappTrackState {
        let account_addr = signer::address_of(account);
        assert!(exists<DappTrackState>(@dapptrack_addr), E_NOT_INITIALIZED);

        let state = borrow_global_mut<DappTrackState>(@dapptrack_addr);
        
        let donations_len = vector::length(&state.donations);
        let i = 0;
        let found = false;

        while (i < donations_len) {
            let donation = vector::borrow_mut(&mut state.donations, i);
            if (donation.id == donation_id) {
                assert!(donation.donor == account_addr, E_UNAUTHORIZED);
                vector::push_back(&mut donation.linked_delivery_ids, delivery_id);
                found = true;
                break
            };
            i = i + 1;
        };

        assert!(found, E_DONATION_NOT_FOUND);

        event::emit(DonationLinked {
            donation_id,
            delivery_id,
            timestamp: timestamp::now_seconds()
        });
    }

    // ======================== View Functions ========================

    #[view]
    public fun get_all_funds(): vector<FundAllocation> acquires DappTrackState {
        if (!exists<DappTrackState>(@dapptrack_addr)) {
            return vector::empty<FundAllocation>()
        };
        let state = borrow_global<DappTrackState>(@dapptrack_addr);
        state.funds
    }

    #[view]
    public fun get_fund_by_id(fund_id: u64): FundAllocation acquires DappTrackState {
        assert!(exists<DappTrackState>(@dapptrack_addr), E_NOT_INITIALIZED);
        let state = borrow_global<DappTrackState>(@dapptrack_addr);
        let funds_len = vector::length(&state.funds);
        let i = 0;

        while (i < funds_len) {
            let fund = vector::borrow(&state.funds, i);
            if (fund.id == fund_id) {
                return *fund
            };
            i = i + 1;
        };

        abort E_FUND_NOT_FOUND
    }

    #[view]
    public fun get_all_deliveries(): vector<ResourceDelivery> acquires DappTrackState {
        if (!exists<DappTrackState>(@dapptrack_addr)) {
            return vector::empty<ResourceDelivery>()
        };
        let state = borrow_global<DappTrackState>(@dapptrack_addr);
        state.deliveries
    }

    #[view]
    public fun get_deliveries_by_fund(fund_id: u64): vector<ResourceDelivery> acquires DappTrackState {
        if (!exists<DappTrackState>(@dapptrack_addr)) {
            return vector::empty<ResourceDelivery>()
        };
        let state = borrow_global<DappTrackState>(@dapptrack_addr);
        let all_deliveries = &state.deliveries;
        let result = vector::empty<ResourceDelivery>();
        let i = 0;
        let len = vector::length(all_deliveries);

        while (i < len) {
            let delivery = vector::borrow(all_deliveries, i);
            if (delivery.fund_id == fund_id) {
                vector::push_back(&mut result, *delivery);
            };
            i = i + 1;
        };

        result
    }

    #[view]
    public fun get_all_donations(): vector<Donation> acquires DappTrackState {
        if (!exists<DappTrackState>(@dapptrack_addr)) {
            return vector::empty<Donation>()
        };
        let state = borrow_global<DappTrackState>(@dapptrack_addr);
        state.donations
    }

    #[view]
    public fun get_donation_by_id(donation_id: u64): Donation acquires DappTrackState {
        assert!(exists<DappTrackState>(@dapptrack_addr), E_NOT_INITIALIZED);
        let state = borrow_global<DappTrackState>(@dapptrack_addr);
        let donations_len = vector::length(&state.donations);
        let i = 0;

        while (i < donations_len) {
            let donation = vector::borrow(&state.donations, i);
            if (donation.id == donation_id) {
                return *donation
            };
            i = i + 1;
        };

        abort E_DONATION_NOT_FOUND
    }

    #[test_only]
    public fun init_module_for_test(account: &signer) {
        init_module(account);
    }
}
