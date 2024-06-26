jest.mock('../common/module.store')
import { FactoryQuestionItem } from 'src/test/factories/Question'
import { FactoryUser } from 'src/test/factories/User'

import { QuestionStore } from './question.store'

const mockToggleDocSubscriber = jest.fn()
jest.mock('../common/toggleDocSubscriberStatusByUserName', () => {
  return {
    __esModule: true,
    toggleDocSubscriberStatusByUserName: () => mockToggleDocSubscriber(),
  }
})

const mockToggleDocUsefulByUser = jest.fn()
jest.mock('../common/toggleDocUsefulByUser', () => ({
  __esModule: true,
  toggleDocUsefulByUser: () => mockToggleDocUsefulByUser(),
}))

const factory = async () => {
  const store = new QuestionStore()
  store.isTitleThatReusesSlug = jest.fn().mockResolvedValue(false)

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  store.activeUser = FactoryUser()

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  store.db.set.mockImplementation((newValue) => {
    return newValue
  })

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  store.db.update.mockImplementation((newValue) => {
    return newValue
  })

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  store.db.getWhere.mockImplementation(async () => {})

  return {
    store,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    setFn: store.db.set,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    getWhereFn: store.db.getWhere,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    updateFn: store.db.update,
  }
}

describe('question.store', () => {
  describe('upsertQuestion', () => {
    it('assigns _createdBy', async () => {
      const { store, setFn } = await factory()
      const newQuestion = FactoryQuestionItem({
        title: 'So what is plastic?',
        _createdBy: undefined,
      })

      // Act
      await store.upsertQuestion(newQuestion)

      expect(setFn).toBeCalledWith(
        expect.objectContaining({
          _createdBy: store.activeUser?.userName,
        }),
      )
    })
  })

  describe('fetchQuestionBySlug', () => {
    it('handles empty query response', async () => {
      const { store } = await factory()
      const newQuestion = FactoryQuestionItem({
        title: 'How do you survive living in a tent?',
      })

      // Act
      expect(await store.fetchQuestionBySlug(newQuestion.slug)).toBe(null)
    })

    it('returns a valid response', async () => {
      const { store, getWhereFn } = await factory()
      const newQuestion = FactoryQuestionItem({
        title: 'Question title',
      })

      getWhereFn.mockResolvedValue([newQuestion])

      // Act
      const questionDoc = await store.fetchQuestionBySlug(newQuestion.slug)

      expect(getWhereFn.mock.calls[0]).toEqual(['slug', '==', newQuestion.slug])
      expect(questionDoc).toStrictEqual(newQuestion)
    })

    it('returns a valid response when a previous slug', async () => {
      const { store, getWhereFn } = await factory()
      const newQuestion = FactoryQuestionItem({
        title: 'Can I run a shredder at home?',
        previousSlugs: ['shredder-at-home'],
      })

      getWhereFn.mockResolvedValue([newQuestion])

      // Act
      const questionDoc = await store.fetchQuestionBySlug('shredder-at-home')

      expect(questionDoc).toStrictEqual(newQuestion)
    })
  })

  describe('incrementViews', () => {
    it('increments views by one', async () => {
      const { store, updateFn } = await factory()

      const question = FactoryQuestionItem({
        title: 'which trees to cut down',
        _createdBy: undefined,
        total_views: 56,
      })

      // Act
      await store.upsertQuestion(question)

      // Act
      await store.incrementViewCount(question)
      const updatedTotalViews = 57

      expect(updateFn).toHaveBeenCalledWith(
        expect.objectContaining({ total_views: updatedTotalViews }),
        expect.anything(),
      )
    })
  })

  describe('toggleSubscriberStatusByUserName', () => {
    it('calls the toggle subscriber function', async () => {
      const { store } = await factory()
      store.activeQuestionItem = FactoryQuestionItem()

      await store.toggleSubscriberStatusByUserName()

      expect(mockToggleDocSubscriber).toHaveBeenCalled()
    })
  })

  describe('toggleUsefulByUser', () => {
    it('calls the toogle voted for function', async () => {
      const { store } = await factory()
      store.activeQuestionItem = FactoryQuestionItem()

      await store.toggleUsefulByUser()

      expect(mockToggleDocUsefulByUser).toHaveBeenCalled()
    })
  })
})
