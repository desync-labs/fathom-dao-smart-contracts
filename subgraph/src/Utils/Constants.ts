import { BigDecimal, BigInt } from "@graphprotocol/graph-ts"

export class Constants{
    // public static STAKING_CONTRACT:string = '0x70f03000879377A52BCbd5280dC98D9356f9478A' //new contract-> 0x471d48B3451BA381B708aCaa83f2c9298C2bA34D
    // public static STAKING_GETTER:string = '0x8B9Bdbd0a506Ed600395107B619CBcdE658D7288' //new contract -> 0x4FAB53ddb960565E380c109AC475C945C829b891
    // public static VFTHM:string = '0x046fbf910512003a08e170631b9BcDf5235191B6' //new contract ->0xA41Cd4fB85Db24cB018B95373cf61E01a753af03

    public static STAKING_CONTRACT:string = '0x471d48B3451BA381B708aCaa83f2c9298C2bA34D' //new contract-> 
    public static STAKING_GETTER:string = '0x4FAB53ddb960565E380c109AC475C945C829b891' //new contract -> 
    public static VFTHM:string = '0xA41Cd4fB85Db24cB018B95373cf61E01a753af03' 

    public static WAD:BigInt = BigInt.fromI64(10**18)
    public static RAY:BigInt = BigInt.fromI64( 10**27)
    public static RAD:BigInt = BigInt.fromI64( 10**45)

    public  static divByRAY(number: BigInt): BigInt {
        return number.div(Constants.WAD).div(BigInt.fromI64(10**9))
    }

    public  static divByRAYToDecimal(number: BigInt): BigDecimal {
        return number.toBigDecimal().div(Constants.WAD.toBigDecimal()).div(BigInt.fromI64(10**9).toBigDecimal())
    }

    public  static divByRAD(number: BigInt): BigInt {
        return number.div(Constants.WAD).div(Constants.WAD).div(BigInt.fromI64(10**9))
    }
}

//{"vFTHM":"0xA41Cd4fB85Db24cB018B95373cf61E01a753af03","timelockController":"0x991Abc3fE4881b1e4E73e2Cf83Fa89A06C27dEd2","multiSigWallet":"0x6724E244c9C2549a7ce7B320533B902d1483CfFf","fthmToken":"0x51DA06Bd93b2d9425c19bC64BEBaC19f302CDa53","fthmGovernor":"0x3C94e64a278dFCb334E2264c9ea4b9F4Af7Ea433","stakingImplementation":"0x70492fEF1ED4a5612851752fcf60B92B3fA02b6E","vaultImplementation":"0x1612BCA52Fa4EDEC1ff0fF95561eca15aD73A05f","rewardsCalculator":"0x7195B22A604207605854DC3F874Dec14bb5Cc87f","stakingProxyAdmin":"0xb392432100d7510e79FE2D2E768D948f76D19E78","staking":"0x471d48B3451BA381B708aCaa83f2c9298C2bA34D","vaultProxyAdmin":"0xb843061D00dE9b2c206f4ae0D3297140cb5aaC0D","vault":"0x5CEcF706b5d3e59e0Bc38485Cce32FE5d8f90a52","stakingGetter":"0x4FAB53ddb960565E380c109AC475C945C829b891"}