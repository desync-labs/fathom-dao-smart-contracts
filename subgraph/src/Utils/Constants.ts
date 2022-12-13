import { BigDecimal, BigInt } from "@graphprotocol/graph-ts"

export class Constants{
    public static STAKING_CONTRACT:string = '0xa8402AFd8ed9F4cfC9B149dcC13973777dCa143c'
    public static STAKING_GETTER:string = '0xB6ec5308fEA0C6C11Cce35712a399Ef6741CA8DF'
    public static VFTHM:string = '0x4981c2553A5580eb0Ad5F6efA9d0F2A82CF88353'

    public static GOVERNANCE:string = '0xDcDa226fa9c23E7F6c88DB8a607Cc0E2DD3E17C7'

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