// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {OneOfUsAbi} from "../OneOfUs.sol";

contract DeployOneOfUsAbi is Script {
    function run() external returns (address) {
        bytes32 pkBytes = vm.envBytes32("PRIVATE_KEY");
        uint256 deployerPrivateKey = uint256(pkBytes);
        
        vm.startBroadcast(deployerPrivateKey);

        OneOfUsAbi abiContract = new OneOfUsAbi();
        console.log("OneOfUsAbi deployed at:", address(abiContract));

        vm.stopBroadcast();
        return address(abiContract);
    }
}