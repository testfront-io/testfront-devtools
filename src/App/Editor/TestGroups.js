import React from 'react'
import styled from 'styled-components'
import { mix } from 'polished'
import * as UI from '../../UI'
import TestGroup from './TestGroup'
import Test from './Test'

import {
  IDLE,
  RECORDING,
  TESTING
} from '../../constants'

const TestGroups = styled(({ store, testGroups, ...props }) => {
  const testCount = testGroups.reduce((testCount, testGroup) => {
    if (!testGroup.skip) {
      testCount += testGroup.tests.filter(test => !test.skip && test.frames.length > 0).length
    }

    return testCount
  }, 0)

  return (
    <UI.Form { ...props }>
      {testGroups.map((testGroup, testGroupIndex) => (
        <TestGroup
          key={`TestGroup_${testGroupIndex}`}
          store={store}
          testGroupIndex={testGroupIndex}
          testGroup={testGroup}
        />
      ))}

      <section>
        <UI.Button onClick={() => store.addTestGroup()}>
          <span>Add Test Group</span>
        </UI.Button>

        <UI.Error>
          {store.error.testGroups || ``}
        </UI.Error>
      </section>

      <UI.Footer fixed={true}>
        <div>
          {testCount > 0 && (
            <UI.StateIcon
              store={store}
              width={store.state === RECORDING ? 45 : 30}
              height={store.state === RECORDING ? 45 : 30}
            />
          )}

          <span style={testCount > 0 ? {} : { marginLeft: 10 }}>
            {testCount} test{testCount === 1 ? `` : `s`}
          </span>

          <aside>
            {store.state === RECORDING && (
              <UI.Button backgroundColor='red' onClick={() => store.stopRecording()}>
                <span>Stop Recording</span>
              </UI.Button>
            )}

            {store.state === TESTING && (
              <UI.Button backgroundColor='red' onClick={() => store.stopTesting()}>
                <span>Stop Testing</span>
              </UI.Button>
            )}

            {store.state === IDLE && testCount > 0 && (
              <UI.Button backgroundColor='green' onClick={() => store.startTesting({ allTestGroups: true, allTests: true })}>
                <span>Run All Tests</span>
              </UI.Button>
            )}
          </aside>
        </div>
      </UI.Footer>
    </UI.Form>
  )
})`
  margin-bottom: 75px;

  > ${TestGroup} {
    margin: 0 auto 60px;

    > footer {
      > details {
        > div {
          ${Test} {
            margin: 0 auto 30px;
          }
        }
      }
    }
  }

  > section {
    &:last-of-type {
      margin-bottom: 105px;
      text-align: center;

      > ${UI.Button} {
        padding: 5px 30px;
        visibility: ${({ store }) => store.state === IDLE ? `visible` : `hidden`};
      }
    }
  }

  > ${UI.Footer} {
    height: 50px;
    padding: 0;

    > div {
      position: relative;
      width: 600px;
      height: 100%;
      max-width: 100%;
      padding: 10px;
      margin: 0 auto;
      font-size: 20px;
      line-height: 30px;
      background: ${({ theme }) => mix(0.5, theme.colors.background, `rgba(63, 63, 63, 1)`)};
      box-shadow: 0 -3px 6px 6px rgba(0, 0, 0, 0.05);

      > span {
        display: inline-block;
        vertical-align: top;
        font-size: 20px;
        line-height: 30px;
      }

      > ${UI.StateIcon} {
        width: ${({ store }) => store.state === RECORDING ? `45px` : `30px`};
        height: ${({ store }) => store.state === RECORDING ? `45px` : `30px`};
        margin: ${({ store }) => store.state === RECORDING ? `-8px -2.5px -7px -7.5px` : `0 5px 0 0`};
      }

      > aside {
        position: absolute;
        top: 10px;
        right: 10px;

        > ${UI.Button} {
          vertical-align: top;
          font-size: 20px;

          ~ ${UI.Button} {
            margin-left: 5px;
          }
        }
      }
    }
  }
`

export default TestGroups
