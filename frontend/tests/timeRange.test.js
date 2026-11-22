import test from 'node:test'
import assert from 'node:assert/strict'
import { canSelectRange, clockTime, minutes, timeBoundaries } from '../src/utils/timeRange.js'

const slots = [17, 18, 19, 20, 21].map((hour) => ({ time: `${hour}:00`, is_available: true }))

test('17:00–20:00 занимает ровно три часа', () => {
  assert.equal(canSelectRange(slots, '17:00', '20:00'), true)
  assert.equal((minutes('20:00') - minutes('17:00')) / 60, 3)
  assert.equal(clockTime(minutes('17:00') + 3 * 60), '20:00')
})

test('нельзя протянуть интервал через занятый час', () => {
  const occupied = slots.map((s) => ({ ...s, is_available: s.time !== '18:00' }))
  assert.equal(canSelectRange(occupied, '17:00', '20:00'), false)
  assert.equal(canSelectRange(occupied, '19:00', '21:00'), true)
})

test('можно закончить в момент начала чужой брони', () => {
  const occupied = slots.map((s) => ({ ...s, is_available: s.time !== '20:00' }))
  assert.equal(canSelectRange(occupied, '17:00', '20:00'), true)
  assert.equal(canSelectRange(occupied, '17:00', '21:00'), false)
})

test('добавляется время закрытия для выбора конца последнего часа', () => {
  assert.deepEqual(timeBoundaries(slots), ['17:00', '18:00', '19:00', '20:00', '21:00', '22:00'])
  assert.equal(canSelectRange(slots, '21:00', '22:00'), true)
  assert.equal(canSelectRange(slots, '21:00', '23:00'), false)
})

test('нулевой, обратный и неполный интервалы не принимаются', () => {
  assert.equal(canSelectRange(slots, '17:00', '17:00'), false)
  assert.equal(canSelectRange(slots, '20:00', '17:00'), false)
  assert.equal(canSelectRange(slots, '17:00', '17:30'), false)
  assert.deepEqual(timeBoundaries([]), [])
})
