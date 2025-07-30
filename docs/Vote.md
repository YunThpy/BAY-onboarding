# Solidity API

## Vote

### Contract
Vote : Week2/Vote/Vote.sol

 --- 
### Modifiers:
### afterStart

```solidity
modifier afterStart()
```

### beforeEnd

```solidity
modifier beforeEnd()
```

### onlyOnce

```solidity
modifier onlyOnce()
```

 --- 
### Functions:
### constructor

```solidity
constructor(uint256 _durationInSeconds) public
```

### vote

```solidity
function vote(string _candidate) public
```

 --- 
### Events:
### Voted

```solidity
event Voted(address voter, string candidate, uint256 timestamp)
```

