import _ from "lodash"
import { useState, useMemo, useEffect } from "react"
import { PublicKey } from "@solana/web3.js"
import { FilteredSpecificAccountTypeMap } from "../models"
import { programs } from "@metaplex/js"
import { getUserAddress } from "../solana/seedAddresses"
import { getClusterConstants } from "../constants"

const {
  metadata: { Metadata },
} = programs

type MaybePublicKey = PublicKey | undefined

export const useMetaplexMetadataAddresses = (
  nftAccounts?: FilteredSpecificAccountTypeMap<"hTokenAccount">
) => {
  const [seedAddresses, setSeedAddresses] = useState<
    { [key: string]: PublicKey } | undefined
  >()

  useEffect(() => {
    if (!nftAccounts) {
      setSeedAddresses(undefined)
      return
    }
    ;(async function () {
      const metadataPublicKeysList = await Promise.all(
        _.map(nftAccounts, async (nftAccount) => {
          const mintPublicKey = new PublicKey(nftAccount.data.mint)
          const metadataPublicKey = await Metadata.getPDA(
            mintPublicKey.toString()
          )
          return [nftAccount.publicKey, metadataPublicKey]
        })
      )
      const metadataPublicKeys = _.reduce(
        metadataPublicKeysList,
        (accum: { [key: string]: PublicKey }, value) => {
          const [nftAccountPublicKey, metadataPublicKey] = value
          accum[nftAccountPublicKey.toString()] = metadataPublicKey
          return accum
        },
        {}
      )
      setSeedAddresses(metadataPublicKeys)
    })()
  }, [_.size(nftAccounts)])
  return seedAddresses
}

export const useUserAccountAddress = (walletPublicKey?: PublicKey) => {
  const [seedAddress, setSeedAddress] = useState<PublicKey | undefined>(
    undefined
  )
  useEffect(() => {
    ;(async function () {
      if (!walletPublicKey) {
        return
      }
      const { ADDRESS_STAKING_POOL, PROGRAM_NFT_STAKING } = getClusterConstants(
        "ADDRESS_STAKING_POOL",
        "PROGRAM_NFT_STAKING"
      )
      const [userAddress] = await getUserAddress(
        ADDRESS_STAKING_POOL,
        walletPublicKey,
        PROGRAM_NFT_STAKING
      )
      setSeedAddress(userAddress)
    })()
  }, [walletPublicKey?.toString()])

  return seedAddress
}
