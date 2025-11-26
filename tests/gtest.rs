use sails_rs::{calls::*, gtest::{calls::*, System}, ActorId};

use one_of_us_client::traits::*;

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
    let remoting = GTestRemoting::new(system, ACTOR_ID.into());

    let program_code_id = remoting.system().submit_code(one_of_us::WASM_BINARY);
    let program_factory = one_of_us_client::OneOfUsFactory::new(remoting.clone());

    let program_id = program_factory
        .new()
        .send_recv(program_code_id, b"salt")
        .await
        .unwrap();

    let mut service_client = one_of_us_client::OneOfUs::new(remoting.clone());

    let result = service_client
        .join_us()
        .send_recv(program_id)
        .await
        .unwrap();

    assert_eq!(result, true);
}

#[tokio::test]
async fn join_twice_returns_false() {
    let system = System::new();
    system.mint_to(ACTOR_ID, 100_000_000_000_000);
    let remoting = GTestRemoting::new(system, ACTOR_ID.into());

    let program_code_id = remoting.system().submit_code(one_of_us::WASM_BINARY);
    let program_factory = one_of_us_client::OneOfUsFactory::new(remoting.clone());

    let program_id = program_factory
        .new()
        .send_recv(program_code_id, b"salt")
        .await
        .unwrap();

    let mut service_client = one_of_us_client::OneOfUs::new(remoting.clone());

    let result = service_client.join_us().send_recv(program_id).await.unwrap();
    assert_eq!(result, true);

    let result = service_client.join_us().send_recv(program_id).await.unwrap();
    assert_eq!(result, false);
}

#[tokio::test]
async fn count_works() {
    let system = System::new();
    system.mint_to(ACTOR_ID, 100_000_000_000_000);
    let remoting = GTestRemoting::new(system, ACTOR_ID.into());

    let program_code_id = remoting.system().submit_code(one_of_us::WASM_BINARY);
    let program_factory = one_of_us_client::OneOfUsFactory::new(remoting.clone());

    let program_id = program_factory
        .new()
        .send_recv(program_code_id, b"salt")
        .await
        .unwrap();

    let mut service_client = one_of_us_client::OneOfUs::new(remoting.clone());

    let count = service_client.count().recv(program_id).await.unwrap();
    assert_eq!(count, 0);

    service_client.join_us().send_recv(program_id).await.unwrap();

    let count = service_client.count().recv(program_id).await.unwrap();
    assert_eq!(count, 1);
}

#[tokio::test]
async fn is_one_of_us_works() {
    let system = System::new();
    system.mint_to(ACTOR_ID, 100_000_000_000_000);
    let remoting = GTestRemoting::new(system, ACTOR_ID.into());

    let program_code_id = remoting.system().submit_code(one_of_us::WASM_BINARY);
    let program_factory = one_of_us_client::OneOfUsFactory::new(remoting.clone());

    let program_id = program_factory
        .new()
        .send_recv(program_code_id, b"salt")
        .await
        .unwrap();

    let mut service_client = one_of_us_client::OneOfUs::new(remoting.clone());

    let address = actor_id_to_address(ACTOR_ID.into());
    let is_member = service_client.is_one_of_us(address).recv(program_id).await.unwrap();
    assert_eq!(is_member, false);

    service_client.join_us().send_recv(program_id).await.unwrap();

    let is_member = service_client.is_one_of_us(address).recv(program_id).await.unwrap();
    assert_eq!(is_member, true);
}

#[tokio::test]
async fn list_works() {
    let system = System::new();
    system.mint_to(ACTOR_ID, 100_000_000_000_000);
    
    let remoting = GTestRemoting::new(system, ACTOR_ID.into());

    let program_code_id = remoting.system().submit_code(one_of_us::WASM_BINARY);
    let program_factory = one_of_us_client::OneOfUsFactory::new(remoting.clone());

    let program_id = program_factory
        .new()
        .send_recv(program_code_id, b"salt")
        .await
        .unwrap();

    let mut service_client = one_of_us_client::OneOfUs::new(remoting.clone());

    // Add builder
    service_client.join_us().send_recv(program_id).await.unwrap();

    // Get list
    let list = service_client.list(0, 100).recv(program_id).await.unwrap();
    assert_eq!(list.len(), 1);
    assert_eq!(list[0], actor_id_to_address(ACTOR_ID.into()));
}
