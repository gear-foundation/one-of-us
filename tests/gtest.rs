use sails_rs::{
    client::{Deployment, GtestEnv},
    gtest::System,
    ActorId,
};

use one_of_us_client::{OneOfUs, OneOfUsCtors, OneOfUsProgram, one_of_us::OneOfUs as OneOfUsService};

const ACTOR_ID: u64 = 42;

// Helper: convert ActorId to [u16; 16]
fn actor_id_to_address(id: ActorId) -> [u16; 16] {
    let bytes: [u8; 32] = id.into();
    let mut result = [0u16; 16];
    for i in 0..16 {
        result[i] = u16::from_be_bytes([bytes[i * 2], bytes[i * 2 + 1]]);
    }
    result
}

#[tokio::test]
async fn join_works() {
    let system = System::new();
    system.mint_to(ACTOR_ID, 100_000_000_000_000);
    let env = GtestEnv::new(system, ACTOR_ID.into());

    let program_code_id = env.system().submit_code(one_of_us::WASM_BINARY);
    
    let deployment = Deployment::<OneOfUsProgram, _>::new(env.clone(), program_code_id, b"salt".to_vec());
    let actor = deployment.init().await.unwrap();
    let mut service = actor.one_of_us();

    let result = service.join_us().await.unwrap();
    assert_eq!(result, true);
}

#[tokio::test]
async fn join_twice_returns_false() {
    let system = System::new();
    system.mint_to(ACTOR_ID, 100_000_000_000_000);
    let env = GtestEnv::new(system, ACTOR_ID.into());

    let program_code_id = env.system().submit_code(one_of_us::WASM_BINARY);
    
    let deployment = Deployment::<OneOfUsProgram, _>::new(env.clone(), program_code_id, b"salt".to_vec());
    let actor = deployment.init().await.unwrap();
    let mut service = actor.one_of_us();

    let result = service.join_us().await.unwrap();
    assert_eq!(result, true);

    let result = service.join_us().await.unwrap();
    assert_eq!(result, false);
}

#[tokio::test]
async fn count_works() {
    let system = System::new();
    system.mint_to(ACTOR_ID, 100_000_000_000_000);
    let env = GtestEnv::new(system, ACTOR_ID.into());

    let program_code_id = env.system().submit_code(one_of_us::WASM_BINARY);
    
    let deployment = Deployment::<OneOfUsProgram, _>::new(env.clone(), program_code_id, b"salt".to_vec());
    let actor = deployment.init().await.unwrap();
    let mut service = actor.one_of_us();

    let count = service.count().query().unwrap();
    assert_eq!(count, 0);

    service.join_us().await.unwrap();

    let count = service.count().query().unwrap();
    assert_eq!(count, 1);
}

#[tokio::test]
async fn is_one_of_us_works() {
    let system = System::new();
    system.mint_to(ACTOR_ID, 100_000_000_000_000);
    let env = GtestEnv::new(system, ACTOR_ID.into());

    let program_code_id = env.system().submit_code(one_of_us::WASM_BINARY);
    
    let deployment = Deployment::<OneOfUsProgram, _>::new(env.clone(), program_code_id, b"salt".to_vec());
    let actor = deployment.init().await.unwrap();
    let mut service = actor.one_of_us();

    let address = actor_id_to_address(ACTOR_ID.into());
    let is_member = service.is_one_of_us(address).query().unwrap();
    assert_eq!(is_member, false);

    service.join_us().await.unwrap();

    let is_member = service.is_one_of_us(address).query().unwrap();
    assert_eq!(is_member, true);
}

#[tokio::test]
async fn list_works() {
    let system = System::new();
    system.mint_to(ACTOR_ID, 100_000_000_000_000);
    let env = GtestEnv::new(system, ACTOR_ID.into());

    let program_code_id = env.system().submit_code(one_of_us::WASM_BINARY);
    
    let deployment = Deployment::<OneOfUsProgram, _>::new(env.clone(), program_code_id, b"salt".to_vec());
    let actor = deployment.init().await.unwrap();
    let mut service = actor.one_of_us();

    // Add builder
    service.join_us().await.unwrap();

    // Get list
    let list = service.list(0, 100).query().unwrap();
    assert_eq!(list.len(), 1);
    assert_eq!(list[0], actor_id_to_address(ACTOR_ID.into()));
}
