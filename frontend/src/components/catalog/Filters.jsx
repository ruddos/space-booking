import { plural } from '../../utils/format.js'
import { AREA_OPTIONS, FEATURES } from '../../utils/rooms.js'
import { CheckIcon } from '../Icons.jsx'

export const PRICE_MIN = 0
export const PRICE_MAX = 6000
const STEP = 100

function Checkbox({ checked, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-[9px] text-[15px]">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        className={`grid size-5 shrink-0 place-items-center rounded-[5px] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40 ${
          checked ? 'border-accent bg-accent text-white' : 'border-[#9999ad] bg-white'
        }`}
      >
        {checked && <CheckIcon size={14} strokeWidth={3} />}
      </span>
      {children}
    </label>
  )
}

function PriceInput({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold text-muted">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={PRICE_MIN}
        max={PRICE_MAX}
        step={STEP}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 h-[46px] w-full rounded-[10px] border border-line px-3 text-[15px] font-bold outline-none focus:border-accent"
      />
    </label>
  )
}

export default function Filters({ value, onChange, onReset, found, onShow }) {
  const set = (patch) => onChange({ ...value, ...patch })
  const toggle = (key, item) =>
    set({ [key]: value[key].includes(item) ? value[key].filter((x) => x !== item) : [...value[key], item] })

  const left = ((value.priceFrom - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100
  const right = ((value.priceTo - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100

  return (
    <div className="rounded-[22px] border border-line bg-white p-[25px]">
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-extrabold">Фильтры</h2>
        <button type="button" onClick={onReset} className="text-[14px] font-bold text-accent hover:underline">
          Сбросить
        </button>
      </div>

      <h3 className="mt-6 text-[15px] font-bold">Цена за час, ₽</h3>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <PriceInput
          label="от"
          value={value.priceFrom}
          onChange={(v) => set({ priceFrom: Math.min(v, value.priceTo) })}
        />
        <PriceInput label="до" value={value.priceTo} onChange={(v) => set({ priceTo: Math.max(v, value.priceFrom) })} />
      </div>
      <div className="relative mt-4">
        <div className="absolute top-[7px] right-0 left-0 h-1 rounded-sm bg-[#e6e6ed]" />
        <div
          className="absolute top-[7px] h-1 rounded-sm bg-accent"
          style={{ left: `${left}%`, width: `${right - left}%` }}
        />
        <div className="range-dual">
          <input
            type="range"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={STEP}
            value={value.priceFrom}
            onChange={(e) => set({ priceFrom: Math.min(Number(e.target.value), value.priceTo - STEP) })}
            aria-label="Цена от"
          />
          <input
            type="range"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={STEP}
            value={value.priceTo}
            onChange={(e) => set({ priceTo: Math.max(Number(e.target.value), value.priceFrom + STEP) })}
            aria-label="Цена до"
          />
        </div>
      </div>

      <h3 className="mt-7 text-[15px] font-bold">Площадь</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {AREA_OPTIONS.map((o) => {
          const on = value.areas.includes(o.key)
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => toggle('areas', o.key)}
              aria-pressed={on}
              className={`h-[41px] rounded-[10px] border px-4 text-[14px] transition-colors ${
                on ? 'border-accent bg-accent-light font-bold text-accent-hover' : 'border-line font-semibold hover:bg-bg'
              }`}
            >
              {o.label}
            </button>
          )
        })}
      </div>

      <h3 className="mt-6 text-[15px] font-bold">Особенности</h3>
      <div className="mt-1.5">
        {FEATURES.map((f) => (
          <Checkbox key={f.key} checked={value.features.includes(f.key)} onChange={() => toggle('features', f.key)}>
            {f.label}
          </Checkbox>
        ))}
      </div>

      <h3 className="mt-5 text-[15px] font-bold">Метро или район</h3>
      <input
        value={value.metro}
        onChange={(e) => set({ metro: e.target.value })}
        placeholder="Например, Курская"
        className="mt-3 h-[46px] w-full rounded-[10px] border border-line px-3 text-[15px] outline-none placeholder:text-[#75758a] focus:border-accent"
      />

      <label className="mt-6 flex cursor-pointer items-center justify-between gap-3 rounded-[14px] bg-bg px-4 py-3.5">
        <span className="text-[15px] font-semibold">Только свободные сегодня</span>
        <input
          type="checkbox"
          checked={value.freeToday}
          onChange={() => set({ freeToday: !value.freeToday })}
          className="peer sr-only"
        />
        <span
          className={`grid size-5 shrink-0 place-items-center rounded-[5px] border ${
            value.freeToday ? 'border-accent bg-accent text-white' : 'border-[#9999ad] bg-white'
          }`}
        >
          {value.freeToday && <CheckIcon size={14} strokeWidth={3} />}
        </span>
      </label>

      <button
        type="button"
        onClick={onShow}
        className="mt-6 h-[52px] w-full rounded-[14px] bg-accent text-[16px] font-bold text-white transition-colors hover:bg-accent-hover"
      >
        Показать {found} {plural(found, ['площадку', 'площадки', 'площадок'])}
      </button>
    </div>
  )
}
