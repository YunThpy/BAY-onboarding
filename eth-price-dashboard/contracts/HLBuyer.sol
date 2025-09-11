// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * Minimal helper to place IOC spot buy orders for ETH/USDC on Hyperliquid via CoreWriter.
 * Action ID 1: Limit order (asset, isBuy, limitPx, sz, reduceOnly, encodedTif, cloid)
 * - limitPx, sz are 1e8 scaled integers (per Hyperliquid docs)
 * - encodedTif: 3 = IOC
 *
 * NOTE: This contract only encodes and forwards the Core action. It holds no funds.
 * Users sign the tx on HyperEVM and pay gas in HYPE.
 */
interface CoreWriter {
    function sendRawAction(bytes calldata data) external;
}

contract HLBuyer {
    address public constant CORE_WRITER = 0x3333333333333333333333333333333333333333;

    event SentBuy(uint32 asset, uint64 limitPx, uint64 sz, uint8 tif, bytes data);

    function placeIocBuy(uint32 asset, uint64 limitPx, uint64 sz, uint8 tif) external {
        require(tif == 3, "tif must be IOC(3)");
        bytes memory encoded = abi.encode(
            asset,          // uint32
            true,           // isBuy
            limitPx,        // uint64
            sz,             // uint64
            false,          // reduceOnly
            tif,            // uint8 (1=Alo,2=Gtc,3=Ioc)
            uint128(0)      // cloid=0
        );
        // Build the action envelope: [1 byte version=1][3 bytes actionId=1][payload]
        bytes memory data = new bytes(4 + encoded.length);
        data[0] = 0x01; // version
        data[1] = 0x00; data[2] = 0x00; data[3] = 0x01; // actionId=1 (limit order)
        for (uint256 i = 0; i < encoded.length; i++) {
            data[4 + i] = encoded[i];
        }
        CoreWriter(CORE_WRITER).sendRawAction(data);
        emit SentBuy(asset, limitPx, sz, tif, data);
    }
}
