#![no_std]

use core::cell::{Ref, RefMut};
use sails_rs::{cell::RefCell, collections::BTreeSet, gstd::msg, prelude::*};

// ActorId в сыром виде - это просто [u8; 32]
// Для Sails с ethexe фичей нужно использовать тип который имплементирует SolValue
// Используем обертку вокруг массива байт
type Address = [u8; 32];

struct SyncRefCell<T>(RefCell<T>);
unsafe impl<T> Sync for SyncRefCell<T> {}

static STATE: SyncRefCell<Option<OneOfUsState>> = SyncRefCell(RefCell::new(None));

#[derive(Clone, Default)]
pub struct OneOfUsState {
    pub builders: Vec<Address>,
    pub registered: BTreeSet<Address>,
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
        let sender: Address = msg::source().into();
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
    pub fn is_one_of_us(&self, address: Address) -> bool {
        OneOfUsState::get().registered.contains(&address)
    }

    #[export]
    pub fn list(&self, page: u32, page_size: u32) -> Vec<Address> {
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
}

pub struct OneOfUsProgram;

#[program]
impl OneOfUsProgram {
    pub fn new() -> Self {
        OneOfUsService::init();
        Self
    }

    pub fn one_of_us(&self) -> OneOfUsService {
        OneOfUsService::default()
    }
}
