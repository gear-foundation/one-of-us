#![no_std]

use core::cell::{Ref, RefMut};
use sails_rs::{cell::RefCell, collections::BTreeSet, gstd::msg, prelude::*};

const PROGRAM_VERSION: u32 = 6;

type EthAddress = [u16; 16];

struct SyncRefCell<T>(RefCell<T>);
unsafe impl<T> Sync for SyncRefCell<T> {}

// State for the program
static STATE: SyncRefCell<Option<OneOfUsState>> = SyncRefCell(RefCell::new(None));

#[derive(Clone, Default)]
pub struct OneOfUsState {
    pub builders: Vec<EthAddress>,
    pub registered: BTreeSet<EthAddress>,
}

impl OneOfUsState {
    pub fn get() -> Ref<'static, Self> {
        Ref::map(STATE.0.borrow(), |opt| opt.as_ref().expect("State not initialized"))
    }

    pub fn get_mut() -> RefMut<'static, Self> {
        RefMut::map(STATE.0.borrow_mut(), |opt| opt.as_mut().expect("State not initialized"))
    }

    pub fn init() {
        let mut state = STATE.0.borrow_mut();
        if state.is_some() {
            panic!("State already initialized");
        }
        *state = Some(Self::default());
    }
}

fn actor_id_to_address(actor_id: [u8; 32]) -> EthAddress {
    let mut addr = [0u16; 16];
    for i in 0..16 {
        addr[i] = u16::from_be_bytes([actor_id[i * 2], actor_id[i * 2 + 1]]);
    }
    addr
}

#[derive(Default)]
pub struct OneOfUsService;

impl OneOfUsService {
    pub fn init() -> Self {
        OneOfUsState::init();
        Self::default()
    }
}

#[service]
impl OneOfUsService {
    #[export]
    pub fn join_us(&mut self) -> bool {
        let actor_id: [u8; 32] = msg::source().into();
        let sender = actor_id_to_address(actor_id);
        let mut state = OneOfUsState::get_mut();

        if state.registered.contains(&sender) {
            return false;
        }

        state.builders.push(sender);
        state.registered.insert(sender);
        true
    }

    #[export]
    pub fn count(&self) -> u32 {
        OneOfUsState::get().builders.len() as u32
    }

    #[export]
    pub fn is_one_of_us(&self, addr: EthAddress) -> bool {
        OneOfUsState::get().registered.contains(&addr)
    }

    #[export]
    pub fn list(&self, page: u32, page_size: u32) -> Vec<EthAddress> {
        let state = OneOfUsState::get();
        let start = (page * page_size) as usize;

        state
            .builders
            .iter()
            .skip(start)
            .take(page_size as usize)
            .copied()
            .collect()
    }

    #[export]
    pub fn version(&self) -> u32 {
        PROGRAM_VERSION
    }
}

pub struct OneOfUsProgram;

#[program]
impl OneOfUsProgram {
    pub fn init() -> Self {
        OneOfUsService::init();
        Self
    }

    pub fn one_of_us(&self) -> OneOfUsService {
        OneOfUsService::default()
    }
}
