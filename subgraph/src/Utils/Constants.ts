import { BigDecimal, BigInt } from "@graphprotocol/graph-ts"

export class Constants{
    public static STAKING_CONTRACT:string = '0x45Ef978f70F54eE12149a44128cBe1DBF5040335'
    public static STAKING_GETTER:string = '0xF1ef4b91C88E2F37F292497A71D2C083E88FE988'
    public static VFTHM:string = '0xd81A5Cb1BAdB6a49f3b9B531a581372AF5aEE014'

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

//{"vFTHM":"0xd81A5Cb1BAdB6a49f3b9B531a581372AF5aEE014","timelockController":"0xb03C179eC57FB5e30294fB6C03aFBbE865CCad6C","multiSigWallet":"0xEd375e64D3E84634B9eB223dEE3BB26DbbcAf3d3","fthmToken":"0xCABd991B08ec1A844b29dDA1Aac697D6ab030e8d","fthmGovernor":"0x456F87A25d7F24a7aE8191c2319EfD01fb3161E3","stakingImplementation":"0xF3AC60c0cE0547d5a6e0dabda395a555774Bb9b7","vaultImplementation":"0x9201C5E5E1cf6f6D67B26586182979c0C4c4e053","rewardsCalculator":"0xBE2540627dC3228511DBB6209C7979f09cEF17E2","stakingProxyAdmin":"0xA808346A3Db2Faa079422c8a9c71a54be6748F35","staking":"0x45Ef978f70F54eE12149a44128cBe1DBF5040335","vaultProxyAdmin":"0x8D87AA905eBbe6CF4054c6E44107A13a98469397","vault":"0xEb24c0d42003F5c007132EC36E44bAf30bc0dEa4","stakingGetter":"0xF1ef4b91C88E2F37F292497A71D2C083E88FE988"}
