import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AMOUNT_META } from '../../domain/types'
import type { FoodType, MealAmount } from '../../domain/types'
import type { MealRecord } from '../../domain/types'
import { suggestFoods } from '../../domain/foodCatalog'
import type { FoodDefinition } from '../../domain/foodCatalog'
import { captureNativeMealPhoto, isNativeApp } from '../../lib/nativePlatform'
import { FoodQuickPicker } from './FoodQuickPicker'
import '../../styles.css'

type RecordStep = 'photo' | 'food' | 'amount'

export interface MealDraft {
  imageData: string
  foodType: FoodType
  foodName: string
  amount: MealAmount
}

interface RecordFlowProps {
  onComplete: (meal: MealDraft) => void
  onCancel: () => void
  recovery?: ReactNode
  recentMeals?: readonly MealRecord[]
}

const mealAmounts = Object.keys(AMOUNT_META) as MealAmount[]

export function RecordFlow({ onComplete, onCancel, recovery, recentMeals = [] }: RecordFlowProps) {
  const [step, setStep] = useState<RecordStep>('photo')
  const [imageData, setImageData] = useState<string>()
  const [foodType, setFoodType] = useState<FoodType>()
  const [foodName, setFoodName] = useState<string>()
  const [selectedFoodId, setSelectedFoodId] = useState<string>()
  const [amount, setAmount] = useState<MealAmount>()
  const [photoError, setPhotoError] = useState<string>()
  const [isOpeningCamera, setIsOpeningCamera] = useState(false)
  const nativeApp = useMemo(() => isNativeApp(), [])
  const suggestions = useMemo(
    () => suggestFoods({ now: Date.now(), entries: recentMeals, query: '' }),
    [recentMeals],
  )

  const readPhoto = (file: File | undefined) => {
    if (!file) return

    const reader = new FileReader()
    setPhotoError(undefined)
    reader.onload = () => {
      if (typeof reader.result === 'string') setImageData(reader.result)
    }
    reader.onerror = () => setPhotoError('사진을 불러오지 못했어요. 다시 선택해 주세요.')
    reader.onabort = () => setPhotoError('사진 불러오기가 취소됐어요. 다시 선택해 주세요.')
    reader.readAsDataURL(file)
  }

  const complete = () => {
    if (!imageData || !foodType || !foodName || !amount) return
    onComplete({ imageData, foodType, foodName, amount })
  }

  const capturePhoto = async () => {
    setPhotoError(undefined)
    setIsOpeningCamera(true)
    try {
      const capturedImage = await captureNativeMealPhoto()
      if (capturedImage) setImageData(capturedImage)
    } catch {
      setPhotoError('카메라를 열지 못했어요. 권한을 확인하고 다시 시도해 주세요.')
    } finally {
      setIsOpeningCamera(false)
    }
  }

  const selectFood = (food: FoodDefinition) => {
    setFoodType(food.foodType)
    setFoodName(food.name)
    setSelectedFoodId(food.id)
  }

  return (
    <section className="record-flow" aria-label="식사 기록">
      <p className="eyebrow">FOODEX 기록하기</p>
      {step === 'photo' && (
        <div className="record-step">
          <h1>오늘 먹은 것을 찍어 볼까?</h1>
          <p>사진 한 장이면 멋진 발견 카드가 시작돼!</p>
          {nativeApp ? (
            <button
              className="photo-dropzone"
              type="button"
              aria-label="카메라로 식사 사진 찍기"
              disabled={isOpeningCamera}
              onClick={() => void capturePhoto()}
            >
              {imageData ? <img src={imageData} alt="선택한 식사 사진" /> : <span aria-hidden="true">📷</span>}
              <strong>{isOpeningCamera ? '카메라 여는 중…' : imageData ? '사진을 다시 찍을 수도 있어' : '카메라로 식사 사진 찍기'}</strong>
              <small>맛있게 먹은 순간을 남겨 줘</small>
            </button>
          ) : (
            <>
              <input
                className="photo-input"
                id="meal-camera"
                aria-label="식사 사진 선택"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(event) => readPhoto(event.currentTarget.files?.[0])}
              />
              <label className="photo-dropzone" htmlFor="meal-camera">
                {imageData ? <img src={imageData} alt="선택한 식사 사진" /> : <span aria-hidden="true">📷</span>}
                <strong>{imageData ? '사진을 바꿀 수도 있어' : '카메라로 식사 사진 찍기'}</strong>
                <small>맛있게 먹은 순간을 남겨 줘</small>
              </label>
            </>
          )}
          <input
            className="photo-input"
            id="meal-gallery"
            aria-label="사진첩에서 고르기"
            type="file"
            accept="image/*"
            onChange={(event) => readPhoto(event.currentTarget.files?.[0])}
          />
          <label className="gallery-label" htmlFor="meal-gallery">사진첩에서 고르기</label>
          {photoError && <p className="photo-error" role="alert">{photoError}</p>}
          <div className="record-actions">
            <button className="text-button" type="button" onClick={onCancel}>나중에 할래</button>
            <button type="button" onClick={() => setStep('food')} disabled={!imageData}>다음</button>
          </div>
        </div>
      )}

      {step === 'food' && (
        <div className="record-step">
          <h1>무엇을 먹었어?</h1>
          <p>가장 가까운 친구를 골라 줘.</p>
          <FoodQuickPicker suggestions={suggestions} selectedId={selectedFoodId} onSelect={selectFood} />
          <div className="record-actions">
            <button className="text-button" type="button" onClick={() => setStep('photo')}>이전</button>
            <button type="button" onClick={() => setStep('amount')} disabled={!foodType}>다음</button>
          </div>
        </div>
      )}

      {step === 'amount' && (
        <div className="record-step">
          <h1>얼마나 먹어 봤어?</h1>
          <p>어떤 한입도 멋진 모험이야.</p>
          <div className="choice-grid amount-grid" role="group" aria-label="먹은 양 선택">
            {mealAmounts.map((value) => (
              <button
                className={amount === value ? 'choice-button selected' : 'choice-button'}
                type="button"
                key={value}
                aria-pressed={amount === value}
                onClick={() => setAmount(value)}
              >
                <span>{AMOUNT_META[value].label}</span>
                <small aria-hidden="true">+{AMOUNT_META[value].xp} XP</small>
              </button>
            ))}
          </div>
          <div className="record-actions">
            <button className="text-button" type="button" onClick={() => setStep('food')}>이전</button>
            <button type="button" onClick={complete} disabled={!amount}>카드 열기</button>
          </div>
        </div>
      )}
      {recovery}
    </section>
  )
}
