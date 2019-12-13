import styled from 'styled-components'
import { mix } from 'polished'

/**
 * Themed table. Take a close look at the CSS for the expected element structure.
 */
const Table = styled.table`
  table-layout: fixed;
  border-collapse: collapse;
  width: 100%;
  text-align: left;
  white-space: nowrap;

  > thead {
    > tr {
      > th {
        padding: 15px 10px;
        font-size: 14px;
        font-weight: normal;
        color: rgba(127, 127, 127, 1);
        opacity: 0.75;

        &:first-child {
          padding-left: 15px;
        }

        &:hover {
          opacity: 1;
          background: ${({ theme }) => mix(0.25, theme.colors.primary, `white`)};
          transition: opacity 0.25s ease-in-out, background 0.25s ease-in-out;
          cursor: pointer;
        }
      }
    }
  }

  > tbody {
    > tr {
      opacity: 0.75;

      &:nth-child(odd) {
        background: ${({ theme }) => mix(0.01, theme.colors.primary, `rgba(239, 239, 239, 0.5)`)};
      }

      &:hover {
        opacity: 1;
        background: ${({ theme }) => mix(0.25, theme.colors.primary, `white`)};
        transition: opacity 0.25s ease-in-out, background 0.25s ease-in-out;
        cursor: pointer;
      }

      > td {
        font-size: 18px;
        padding: 10px;
        overflow: hidden;
        text-overflow: ellipsis;

        &:first-child {
          padding-left: 15px;
        }
      }
    }
  }
`

export default Table
