// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract Diary{

    enum Status {
        Good,   // 0
        Normal,   // 1
        Bad   // 2
    }

    struct DiaryInfo{
        string title;
        string content;
        Status status;
        uint timestamp;
    }
    
    mapping(address => Status) private userStatus;
    mapping(address => DiaryInfo[]) private DiaryInfos ;
    
    function addDiary(string memory _title, string memory _content, Status _status) public {
        DiaryInfos[msg.sender].push(
            DiaryInfo({
                title: _title,
                content: _content,
                status: _status,
                timestamp: block.timestamp
            })
        );
    }

    
    // status setter
    function setUserStatus(Status _status) public {
        userStatus[msg.sender] = _status;
    }

    // status getter
    function getUserStatus() public view returns (Status) {
        return userStatus[msg.sender];
    }

    // 기분에 따른 다이어리 보기
    function getDiariesByStatus(Status _status) public view returns (DiaryInfo[] memory) {
        DiaryInfo[] storage allDiaries = DiaryInfos[msg.sender];
        uint count = 0;

        // 동적배열 갯수 세기
        for (uint i = 0; i < allDiaries.length; i++) {
            if (allDiaries[i].status == _status) {
                count++;
            }
        }

        // count만큼 크기 가진 memory 배열 생성
        DiaryInfo[] memory filteredDiaries = new DiaryInfo[](count);
        uint index = 0;

        // 다시 순회하면서 복사
        for (uint i = 0; i < allDiaries.length; i++) {
            if (allDiaries[i].status == _status) {
                filteredDiaries[index] = allDiaries[i];
                index++;
            }
        }

        return filteredDiaries;
    }
}