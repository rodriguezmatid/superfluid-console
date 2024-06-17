import { useState, useEffect, useCallback } from 'react'
import axios, { AxiosError } from 'axios'
import { gql } from 'graphql-request'
import { TokenStatisticsQuery } from '@superfluid-finance/sdk-redux'
import { sfSubgraph } from '../redux/store'

type RequiredTokenStatisticsQuery = Required<
  Omit<TokenStatisticsQuery, 'block'>
>

// interface QueryArgs {
//   status: string
// Add other query parameters here as needed
// }

interface ApiResponse {
  tokenStatistics: {
    id: string
    token: {
      name: string
      isListed: boolean
      symbol: string
    }
    totalNumberOfActiveStreams: number
    totalOutflowRate: string
  }[]
}

interface UseMetricsQueryReturn {
  tokenStatsData: ApiResponse | null
  triggerStatsQuery: (newQueryArgs: RequiredTokenStatisticsQuery) => void
}

const queryDocument = gql`
  query tokenStatistics(
    $first: Int = 10
    $orderBy: TokenStatistic_orderBy = id
    $orderDirection: OrderDirection = asc
    $skip: Int = 0
    $where: TokenStatistic_filter = {}
    $block: Block_height
  ) {
    tokenStatistics(
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: $where
      first: $first
      skip: $skip
      block: $block
    ) {
      id
      token {
        name
        isListed
        symbol
      }
      totalNumberOfActiveStreams
      totalOutflowRate
    }
  }
`

const useMetricsQuery = (
  initialQueryArgs: RequiredTokenStatisticsQuery
): UseMetricsQueryReturn => {
  const [queryArgs, setQueryArgs] =
    useState<RequiredTokenStatisticsQuery>(initialQueryArgs)
  const [tokenStatsData, setData] = useState<ApiResponse | null>(null)

  const fetchData = (args: RequiredTokenStatisticsQuery) => {
    try {
      const response = sfSubgraph.useCustomQuery({
        chainId: args.chainId,
        document: queryDocument,
        variables: {
          orderBy: args.order.orderBy,
          orderDirection: args.order.orderDirection,
          where: args.filter,
          skip: args.pagination.skip,
          first: args.pagination.take
        }
      })
      if (response.data) {
        setData(response.data as ApiResponse)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setData(null)
    }
  }

  // Effect to fetch data when queryArgs change
  useEffect(() => {
    fetchData(queryArgs)
  }, [queryArgs, fetchData])

  // Trigger function to fetch data with new arguments
  const triggerStatsQuery = (newQueryArgs: RequiredTokenStatisticsQuery) => {
    setQueryArgs(newQueryArgs)
  }

  return { tokenStatsData, triggerStatsQuery }
}

export default useMetricsQuery
