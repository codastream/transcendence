// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract GameStorage is Ownable {
    constructor(address initialOwner) Ownable(initialOwner) {}

    struct Tournament {
        uint32 player1;
        uint32 player2;
        uint32 player3;
        uint32 player4;
        uint32 timestamp;
    }
    mapping(uint32 => Tournament) public tournaments;
    uint256[] public tournamentIds;
    mapping(uint32 => bool) public exists;

    event TournamentStored(uint32 tour_id, uint32 player1, uint32 player2, uint32 player3, uint32 player4, uint32 ts, bytes32 snapshotHash);

    function storeTournament(uint32 id, uint32 p1, uint32 p2, uint32 p3, uint32 p4) external onlyOwner {
        require(!exists[id], "Tournament already stored!");
        uint32 ts = uint32(block.timestamp);
        exists[id] = true;
        tournaments[id] = Tournament(p1, p2, p3, p4, ts);
        bytes32 snapshotHash = keccak256(abi.encode(id, p1, p2, p3, p4, ts));
        emit TournamentStored(id, p1, p2, p3, p4, ts, snapshotHash);
        tournamentIds.push(id); 
    }

    function getTournament(uint32 id) external view returns (Tournament memory){
        require(exists[id], "Tournament does not exist!");
        return tournaments[id];
    }
    
    function getNbTournamentStored() external view returns (uint256){
        return tournamentIds.length;
    }
}
