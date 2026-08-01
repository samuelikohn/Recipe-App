/**
 * Directions stay a single TEXT field in the DB — the numbered-step UI is
 * just a view over that string, with steps delimited by "\n". These helpers
 * are the only place that encoding lives, so editor and display stay in sync.
 */
export function splitDirectionSteps(directions: string): string[] {
	return directions.split("\n")
}

export function joinDirectionSteps(steps: string[]): string {
	return steps.join("\n")
}
