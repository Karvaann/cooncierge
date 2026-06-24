export type TriSortDirection = "none" | "asc" | "desc";

export type TriSortState<K extends string = string> = {
	key: K | null;
	direction: TriSortDirection;
};

const cycleDirection = (direction: TriSortDirection): TriSortDirection => {
	switch (direction) {
		case "none":
			return "asc";
		case "asc":
			return "desc";
		case "desc":
		default:
			return "none";
	}
};

/**
 * Tri-state sorting:
 * - First click: ascending
 * - Second click: descending
 * - Third click: original (none)
 *
 * If a different key is clicked, it starts at ascending.
 */
export const getNextTriSortState = <K extends string>(
	current: TriSortState<K>,
	clickedKey: K
): TriSortState<K> => {
	if (current.key !== clickedKey) {
		return { key: clickedKey, direction: "asc" };
	}

	const nextDirection = cycleDirection(current.direction);
	return nextDirection === "none"
		? { key: null, direction: "none" }
		: { key: clickedKey, direction: nextDirection };
};


export const getItemTimestamp = (item: any): number | null => {
	if (!item) return null;
	const raw = item?.travelDate || item?.formFields?.departureDate || item?.createdAt;
	if (!raw) return null;
	const ts = new Date(raw).getTime();
	return Number.isFinite(ts) ? ts : null;
};

