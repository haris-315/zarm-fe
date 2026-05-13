import { create } from 'zustand';
import { sprintAPI } from '../api/sprints';

export const useSprintStore = create((set, get) => ({
    // Organizations
    organizations: [],
    totalOrgs: 0,
    orgsPage: 1,
    orgsPageSize: 20,

    // Sprints
    sprints: [],
    totalSprints: 0,
    sprintsPage: 1,
    sprintsPageSize: 20,
    currentSprint: null,
    sprintMetrics: null,

    // Findings
    findings: [],
    totalFindings: 0,
    findingsPage: 1,

    // Decision Cards
    decisionCards: [],
    totalDecisionCards: 0,
    decisionCardsPage: 1,

    // Reports
    reports: [],
    totalReports: 0,

    // UI State
    isLoading: false,
    error: null,

    clearError: () => set({ error: null }),

    // ── Organizations ─────────────────────────────────────────

    fetchOrganizations: async (page = 1) => {
        set({ isLoading: true, error: null });
        try {
            const data = await sprintAPI.listOrganizations(page, get().orgsPageSize);
            set({
                organizations: data,
                orgsPage: page,
                isLoading: false,
            });
        } catch (err) {
            set({ error: err.response?.data?.detail || 'Failed to load organizations', isLoading: false });
        }
    },

    // ── Sprints ───────────────────────────────────────────────

    fetchSprints: async (orgId, page = 1) => {
        set({ isLoading: true, error: null });
        try {
            const data = await sprintAPI.listSprints(orgId, page, get().sprintsPageSize);
            set({
                sprints: data.items || [],
                totalSprints: data.total || 0,
                sprintsPage: page,
                isLoading: false,
            });
        } catch (err) {
            set({ error: err.response?.data?.detail || 'Failed to load sprints', isLoading: false });
        }
    },

    createSprint: async (orgId, data) => {
        set({ isLoading: true, error: null });
        try {
            const sprint = await sprintAPI.createSprint(orgId, data);
            set((state) => ({
                sprints: [sprint, ...state.sprints],
                totalSprints: state.totalSprints + 1,
                isLoading: false,
            }));
            return sprint;
        } catch (err) {
            set({ error: err.response?.data?.detail || 'Failed to create sprint', isLoading: false });
            throw err;
        }
    },

    fetchSprint: async (sprintId) => {
        set({ isLoading: true, error: null });
        try {
            const [sprint, metrics] = await Promise.all([
                sprintAPI.getSprint(sprintId),
                sprintAPI.getMetrics(sprintId),
            ]);
            set({ currentSprint: sprint, sprintMetrics: metrics, isLoading: false });
        } catch (err) {
            set({ error: err.response?.data?.detail || 'Failed to load sprint', isLoading: false });
        }
    },

    updateSprint: async (sprintId, data) => {
        try {
            const sprint = await sprintAPI.updateSprint(sprintId, data);
            set({ currentSprint: sprint });
            return sprint;
        } catch (err) {
            set({ error: err.response?.data?.detail || 'Failed to update sprint' });
            throw err;
        }
    },

    advanceSprint: async (sprintId, status) => {
        try {
            const sprint = await sprintAPI.advanceSprint(sprintId, status);
            set({ currentSprint: sprint });
            return sprint;
        } catch (err) {
            set({ error: err.response?.data?.detail || 'Failed to advance sprint' });
            throw err;
        }
    },

    // ── Findings ─────────────────────────────────────────────

    fetchFindings: async (sprintId, day = null, page = 1) => {
        set({ isLoading: true, error: null });
        try {
            const data = await sprintAPI.listFindings(sprintId, day, page);
            set({
                findings: data.items || [],
                totalFindings: data.total || 0,
                findingsPage: page,
                isLoading: false,
            });
        } catch (err) {
            set({ error: err.response?.data?.detail || 'Failed to load findings', isLoading: false });
        }
    },

    createFinding: async (sprintId, data) => {
        set({ isLoading: true, error: null });
        try {
            const finding = await sprintAPI.createFinding(sprintId, data);
            set((state) => ({
                findings: [finding, ...state.findings],
                totalFindings: state.totalFindings + 1,
                isLoading: false,
            }));
            // Refresh metrics
            const metrics = await sprintAPI.getMetrics(sprintId);
            set({ sprintMetrics: metrics });
            return finding;
        } catch (err) {
            set({ error: err.response?.data?.detail || 'Failed to create finding', isLoading: false });
            throw err;
        }
    },

    addFindingComment: async (sprintId, findingId, content, isInternal = false) => {
        try {
            await sprintAPI.addFindingComment(sprintId, findingId, content, isInternal);
        } catch (err) {
            set({ error: err.response?.data?.detail || 'Failed to add comment' });
            throw err;
        }
    },

    // ── Decision Cards ────────────────────────────────────────

    fetchDecisionCards: async (sprintId, page = 1) => {
        set({ isLoading: true, error: null });
        try {
            const data = await sprintAPI.listDecisionCards(sprintId, page);
            set({
                decisionCards: data.items || [],
                totalDecisionCards: data.total || 0,
                decisionCardsPage: page,
                isLoading: false,
            });
        } catch (err) {
            set({ error: err.response?.data?.detail || 'Failed to load decision cards', isLoading: false });
        }
    },

    createDecisionCard: async (sprintId, data) => {
        set({ isLoading: true, error: null });
        try {
            const card = await sprintAPI.createDecisionCard(sprintId, data);
            set((state) => ({
                decisionCards: [card, ...state.decisionCards],
                totalDecisionCards: state.totalDecisionCards + 1,
                isLoading: false,
            }));
            const metrics = await sprintAPI.getMetrics(sprintId);
            set({ sprintMetrics: metrics });
            return card;
        } catch (err) {
            set({ error: err.response?.data?.detail || 'Failed to create decision card', isLoading: false });
            throw err;
        }
    },

    publishDecisionCard: async (sprintId, cardId) => {
        try {
            const card = await sprintAPI.publishDecisionCard(sprintId, cardId);
            set((state) => ({
                decisionCards: state.decisionCards.map((c) => (c.id === cardId ? card : c)),
            }));
            return card;
        } catch (err) {
            set({ error: err.response?.data?.detail || 'Failed to publish decision card' });
            throw err;
        }
    },

    addDecisionComment: async (sprintId, cardId, content) => {
        try {
            await sprintAPI.addDecisionComment(sprintId, cardId, content);
        } catch (err) {
            set({ error: err.response?.data?.detail || 'Failed to add comment' });
            throw err;
        }
    },

    // ── Reports ───────────────────────────────────────────────

    fetchReports: async (sprintId, page = 1) => {
        set({ isLoading: true, error: null });
        try {
            const data = await sprintAPI.listReports(sprintId, page);
            set({
                reports: data.items || [],
                totalReports: data.total || 0,
                isLoading: false,
            });
        } catch (err) {
            set({ error: err.response?.data?.detail || 'Failed to load reports', isLoading: false });
        }
    },

    createReport: async (sprintId, title, file) => {
        set({ isLoading: true, error: null });
        try {
            const report = await sprintAPI.createReport(sprintId, title, file);
            set({ isLoading: false });
            return report;
        } catch (err) {
            const detail = err.response?.data?.detail;
            const errorMsg = Array.isArray(detail)
                ? detail.map((d) => d.msg).join(', ')
                : detail || 'Failed to create report';
            set({ error: errorMsg, isLoading: false });
            throw err;
        }
    },
}));
