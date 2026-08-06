import { create} from 'zustand'

export interface WeeklySnapshot {
 id: string
 profileId: string
 weekStartDate: string // ISO date
 weekEndDate: string // ISO date
 totalCompletions: number
 activeHabits: number
 income: number
 expenses: number
 topMood: string
 xpGained: number
 createdAt: string
}

interface WeeklyReviewState {
 reviews: WeeklySnapshot[]
 setReviews: (reviews: WeeklySnapshot[]) => void
 addReview: (review: WeeklySnapshot) => void
 removeReview: (id: string) => void
 loadReviews: (profileId: string) => void
}

export const useWeeklyReviewStore = create<WeeklyReviewState>((set, get) => ({
 reviews: [],

 setReviews: (reviews) => set({ reviews}),

 addReview: (review) => {
 set((state) => {
 const newReviews = [...state.reviews, review];
 localStorage.setItem(`weekly_reviews_${review.profileId}`, JSON.stringify(newReviews));
 return { reviews: newReviews};
})
},

 removeReview: (id) => {
 set((state) => {
 const newReviews = state.reviews.filter((r) => r.id !== id);
 if (state.reviews.length > 0) {
 localStorage.setItem(`weekly_reviews_${state.reviews[0].profileId}`, JSON.stringify(newReviews));
}
 return { reviews: newReviews};
})
},

 loadReviews: (profileId: string) => {
 const saved = localStorage.getItem(`weekly_reviews_${profileId}`)
 if (saved) {
 set({ reviews: JSON.parse(saved)})
} else {
 set({ reviews: []})
}
},
}))
