import { useFirebaseCollection } from "../hooks/useFirebaseCollection";

export const hasPendingCount = section => Boolean(section.pendingStatus && (section.rawPath || section.path));

// Number of records in a section still in its "needs action" status. Only call
// for sections where hasPendingCount() is true. Firebase shares one listener
// per path, so the sidebar badge and the Overview card cost one subscription.
export function usePendingCount(section) {
    const { data, loading } = useFirebaseCollection(section.rawPath || `submissions/${section.path}`);
    const items = data || [];
    return {
        count: items.filter(item => item.status === section.pendingStatus).length,
        total: items.length,
        loading,
    };
}
