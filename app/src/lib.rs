#![no_std]
#![allow(static_mut_refs)]

use sails_rs::{collections::BTreeSet, gstd::msg, prelude::*};

const PROGRAM_VERSION: u32 = 10;

static mut STATE: Option<OneOfUsState> = None;

#[derive(Clone, Default)]
pub struct OneOfUsState {
    pub builders: Vec<ActorId>,
    pub registered: BTreeSet<ActorId>,
}

impl OneOfUsState {
    fn get() -> &'static Self {
        unsafe { STATE.as_ref().expect("State not initialized") }
    }

    fn get_mut() -> &'static mut Self {
        unsafe { STATE.as_mut().expect("State not initialized") }
    }

    fn init() {
        unsafe {
            if STATE.is_some() {
                panic!("State already initialized");
            }
            STATE = Some(Self::default());
        }
    }

    fn is_registered(&self, actor: &ActorId) -> bool {
        self.registered.contains(actor)
    }

    fn register(&mut self, actor: ActorId) -> bool {
        if self.registered.insert(actor) {
            self.builders.push(actor);
            debug_assert_eq!(self.builders.len(), self.registered.len());
            return true;
        }

        false
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
        let sender = msg::source();
        let state = OneOfUsState::get_mut();
        state.register(sender)
    }

    #[export]
    pub fn count(&self) -> u32 {
        OneOfUsState::get().registered.len() as u32
    }

    #[export]
    pub fn is_one_of_us(&self, addr: ActorId) -> bool {
        OneOfUsState::get().is_registered(&addr)
    }

    #[export]
    pub fn list(&self, page: u32, page_size: u32) -> Vec<ActorId> {
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
