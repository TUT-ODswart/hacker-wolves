export const ROLES = {
  admin: 'Admin',
  supervisor: 'Supervisor',
  manager: 'Manager',
  technician: 'Technician',
}

export const ROLE_HOME = {
  admin: '/admin',
  supervisor: '/admin',
  manager: '/admin',
  technician: '/admin/jobs',
}

const PERMISSIONS = {
  manageIncidents: ['admin', 'supervisor'],
  planWork: ['admin', 'supervisor'],
  simulate: ['admin', 'supervisor'],
  settings: ['admin'],
}

export function can(user, action) {
  return !!user && PERMISSIONS[action].includes(user.role)
}

export const SENSOR_TYPES = {
  level: {
    label: 'Water level',
    unit: 'cm',
    what: 'How full the manhole is.',
    how: 'Ultrasonic sensor under the manhole cover. It bounces sound off the sewage surface and never touches it.',
  },
  flow: {
    label: 'Flow meter',
    unit: 'L/s',
    what: 'How much sewage passes, in litres per second.',
    how: 'Area-velocity flow meter at the bottom of the pipe. It measures how fast the sewage moves and how deep it is, and works out the flow from both.',
  },
  pressure: {
    label: 'Pressure',
    unit: 'bar',
    what: 'Pressure in the pumped pipe (rising main).',
    how: 'Pressure transmitter on the rising main at the pump station.',
  },
}

export const REPORT_TYPES = [
  'Overflowing manhole',
  'Sewage on the street',
  'Leaking pipe',
  'Blocked drain',
  'Bad smell',
  'Other',
]

export const PROBLEM_TYPES = {
  blockage: 'Blockage',
  leak: 'Pipe leak',
  pressure_drop: 'Rising main leak',
}

export const EMERGENCY_LINE = '012 358 9999'
export const DEMO_OTP = '123456'
