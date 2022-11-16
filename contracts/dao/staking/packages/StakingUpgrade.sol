pragma solidity 0.8.13;
import "./StakingHandler.sol";
interface IStakingUpgrade{
     function getLockInfo(address account, uint256 lockId) external view returns (LockedBalance memory);
}
contract StakingUpgrade is StakingHandlers,IStakingUpgrade {
    
    function getLockInfo(address account, uint256 lockId) public view override returns (LockedBalance memory) {
        require(lockId <= locks[account].length, "out of index");
        require(lockId > 0,"lockId cant be 0");
        return locks[account][lockId - 1];
    }
}