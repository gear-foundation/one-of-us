// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IOneOfUs {
    function init(uint128 _value, bool _callReply) external returns (bytes32 messageId);

    function oneOfUsJoinUs(uint128 _value, bool _callReply) external returns (bytes32 messageId);

    function oneOfUsCount(uint128 _value, bool _callReply) external returns (bytes32 messageId);

    function oneOfUsIsOneOfUs(uint128 _value, bool _callReply, uint16[16] calldata addr)
        external
        returns (bytes32 messageId);

    function oneOfUsList(uint128 _value, bool _callReply, uint32 page, uint32 pageSize)
        external
        returns (bytes32 messageId);

    function oneOfUsVersion(uint128 _value, bool _callReply) external returns (bytes32 messageId);
}

contract OneOfUsAbi is IOneOfUs {
    function init(uint128 _value, bool _callReply) external returns (bytes32 messageId) {}

    function oneOfUsJoinUs(uint128 _value, bool _callReply) external returns (bytes32 messageId) {}

    function oneOfUsCount(uint128 _value, bool _callReply) external returns (bytes32 messageId) {}

    function oneOfUsIsOneOfUs(uint128 _value, bool _callReply, uint16[16] calldata addr)
        external
        returns (bytes32 messageId)
    {}

    function oneOfUsList(uint128 _value, bool _callReply, uint32 page, uint32 pageSize)
        external
        returns (bytes32 messageId)
    {}

    function oneOfUsVersion(uint128 _value, bool _callReply) external returns (bytes32 messageId) {}
}

interface IOneOfUsCallbacks {
    function replyOn_init(bytes32 messageId) external;

    function replyOn_oneOfUsJoinUs(bytes32 messageId, bool reply) external;

    function replyOn_oneOfUsCount(bytes32 messageId, uint32 reply) external;

    function replyOn_oneOfUsIsOneOfUs(bytes32 messageId, bool reply) external;

    function replyOn_oneOfUsList(bytes32 messageId, uint16[16][] memory reply) external;

    function replyOn_oneOfUsVersion(bytes32 messageId, uint32 reply) external;

    function onErrorReply(bytes32 messageId, bytes calldata payload, bytes4 replyCode) external;
}

contract OneOfUsCaller is IOneOfUsCallbacks {
    IOneOfUs public immutable gearExeProgram;

    constructor(IOneOfUs _gearExeProgram) {
        gearExeProgram = _gearExeProgram;
    }

    modifier onlyGearExeProgram() {
        require(msg.sender == address(gearExeProgram), "Only Gear.exe program can call this function");
        _;
    }

    function replyOn_init(bytes32 messageId) external onlyGearExeProgram {
        // TODO: implement this
    }

    function replyOn_oneOfUsJoinUs(bytes32 messageId, bool reply) external onlyGearExeProgram {
        // TODO: implement this
    }

    function replyOn_oneOfUsCount(bytes32 messageId, uint32 reply) external onlyGearExeProgram {
        // TODO: implement this
    }

    function replyOn_oneOfUsIsOneOfUs(bytes32 messageId, bool reply) external onlyGearExeProgram {
        // TODO: implement this
    }

    function replyOn_oneOfUsList(bytes32 messageId, uint16[16][] memory reply) external onlyGearExeProgram {
        // TODO: implement this
    }

    function replyOn_oneOfUsVersion(bytes32 messageId, uint32 reply) external onlyGearExeProgram {
        // TODO: implement this
    }

    function onErrorReply(bytes32 messageId, bytes calldata payload, bytes4 replyCode) external onlyGearExeProgram {
        // TODO: implement this
    }
}
