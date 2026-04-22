import { defineDataSet } from '@devotta-labs/declare'
import {
  malariaCaseClass,
  malariaCases,
  malariaDeaths,
  malariaTreated,
} from './dataElements.ts'
import {
  bergen,
  bodo,
  gjovik,
  lillehammer,
  narvik,
  sel,
  stryn,
  vagan,
  voss,
} from './organisationUnits/organisationUnits.ts'
import { captureSharing } from './sharing.ts'

export const malariaMonthly = defineDataSet({
  code: 'DS_MALARIA_MONTHLY',
  name: 'Malaria — monthly reporting',
  shortName: 'Malaria monthly',
  periodType: 'Monthly',
  dataSetElements: [
    { dataElement: malariaCases },
    { dataElement: malariaDeaths },
    { dataElement: malariaTreated },
    { dataElement: malariaCaseClass },
  ],
  // Assigned to every kommune (level 3). DataSets only show up in the Data
  // Entry app for OUs they're assigned to, and reporting happens at the leaf
  // level in this demo — fylker/country are aggregation-only.
  organisationUnits: [
    sel,
    lillehammer,
    gjovik,
    bergen,
    voss,
    stryn,
    bodo,
    narvik,
    vagan,
  ],
  sharing: captureSharing,
})

export const dataSets = [malariaMonthly]
