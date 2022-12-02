import { BigDecimal, BigInt } from "@graphprotocol/graph-ts"

export class Constants{
    public static STAKING_CONTRACT:string = '0x70f03000879377A52BCbd5280dC98D9356f9478A'
    public static STAKING_GETTER:string = '0x8B9Bdbd0a506Ed600395107B619CBcdE658D7288'
    public static VFTHM:string = '0x046fbf910512003a08e170631b9BcDf5235191B6'

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