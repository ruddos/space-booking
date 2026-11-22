import test from 'node:test'
import assert from 'node:assert/strict'
import { LOCATIONS } from '../src/utils/locations.js'
import { mapUrl, routeUrl } from '../src/utils/rooms.js'

test('все шесть залов имеют собственную метку и центр карты у дома', () => {
  assert.equal(Object.keys(LOCATIONS).length, 6)
  assert.equal(new Set(Object.values(LOCATIONS).map(String)).size, 6)
  for (const [address, point] of Object.entries(LOCATIONS)) {
    const url = new URL(mapUrl(address))
    assert.equal(url.searchParams.get('ll'), point.join(','))
    assert.equal(url.searchParams.get('pt'), `${point.join(',')},pm2rdm`)
    assert.equal(url.searchParams.get('z'), '17')
  }
})

test('Социалистическая, 74: метка и маршрут ведут к одному зданию', () => {
  const address = 'Ростов-на-Дону, ул. Социалистическая, 74'
  assert.equal(new URL(mapUrl(address)).searchParams.get('pt'), '39.712686,47.219732,pm2rdm')
  assert.equal(new URL(routeUrl(address)).searchParams.get('rtext'), '~47.219732,39.712686')
})

test('для нового адреса используется поиск адреса, а не центр города', () => {
  const url = new URL(mapUrl('ул. Примерная, 10'))
  assert.equal(url.searchParams.get('mode'), 'search')
  assert.equal(url.searchParams.get('text'), 'Ростов-на-Дону, ул. Примерная, 10')
  assert.equal(url.searchParams.has('ll'), false)
})
