// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract Vote{

    // 하드코딩 된 후보 목록
    string[5] public candidates =["1","2","3","4","5"];

    // 득표수
    mapping (string => uint) public votes;

    // 투표 시작시간과 종료시간
    uint public startTime;
    uint public endTime;

    // 중복 투표 방지
    mapping(address => bool) public hasVoted;

    // 투표 완료한 사람들의 주소와 시점 기록
    struct VoterInfo {
        address voter;
        uint timestamp;
    }

    VoterInfo[] public voterHistory;

    // 이벤트 정의
    event Voted(address indexed voter, string candidate, uint timestamp);

    // 배포 시점 기준으로 투표 시작시간과 종료시간 설정
    constructor(uint _durationInSeconds) {
        startTime = block.timestamp;
        endTime = block.timestamp + _durationInSeconds;
    }

    // modifier: 투표 시작 시간 체크
    modifier afterStart() {
        require(block.timestamp >= startTime, "Voting has not started yet");
        _;
    }

    // modifier: 투표 종료 시간 체크
    modifier beforeEnd() {
        require(block.timestamp <= endTime, "Voting has ended");
        _;
    }

    // modifier: 중복 투표 방지
    modifier onlyOnce() {
        require(!hasVoted[msg.sender], "You have already voted");
        _;
    }

    // 투표 함수
    function vote(string memory _candidate) public afterStart beforeEnd onlyOnce {
        // 후보 유효성 체크
        bool valid = false;
        for(uint i=0; i<candidates.length; i++) {
            if(keccak256(bytes(candidates[i])) == keccak256(bytes(_candidate))) {
                valid = true;
                break;
            }
        }

        require(valid, "Invalid candidate");

        votes[_candidate] += 1;
        hasVoted[msg.sender] = true;

        // 기록 저장
        voterHistory.push(VoterInfo(msg.sender, block.timestamp));

        // 이벤트 발생
        emit Voted(msg.sender, _candidate, block.timestamp);
    }


//     // 투표 완료한 사람 수 반환
//     function getVoterCount() public view returns (uint) {
//         return voterHistory.length;
//     }

//     // 투표 완료자 정보 반환
//     function getAllVoterRecords() public view returns (address[] memory, uint[] memory) {
//     address[] memory voters = new address[](voterHistory.length);
//     uint[] memory timestamps = new uint[](voterHistory.length);

//     for (uint i = 0; i < voterHistory.length; i++) {
//         VoterInfo storage info = voterHistory[i];
//         voters[i] = info.voter;
//         timestamps[i] = info.timestamp;
//     }

//     return (voters, timestamps);
// }
}