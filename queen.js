/*
Queen: Everything revolves around her. She is the one to be fed, she births all the workers, and she forms the right side of the marching formation. 

Strategy: For the opener (detected by the lack of surrounding workers), the queen moves in a straight line via color 3 (cyan), then once she has food, she spawns a gatherer. From there is the early phase, where the queen and the gatherer move at lightspeed. And then from there, the real march starts. If the queen is in formation but loses her gatherer, she spawns another one. 

If the queen loses the formation but has a gatherer or has food, she spawns a gatherer if needed and reverts to early-phase. If she loses all food and the gatherer, she sends a panic, then reverts to the opener. 
*/

//Opening-phase queen (when the gatherer is not visible and the queen has no food)
function opening_queen()
{
	if (this_ant().food > 0) return {cell:0, type:GATHERER};

	//If one of the adjacent spaces has food, gather it
	for (try_cell of random_permutation(SCAN_MOVES))
		if (view[try_cell].food === 1) return {cell:try_cell};

	//Actively avoid other workers
	for (try_cell of random_permutation(SCAN_MOVES))
		if (view[try_cell].ant !== null) return {cell:CCW[try_cell][6]};

	//If the color at the current cell is 1 (white), color it 6 (green)
	if (view[4].color !== 6) return {cell: 4, color: 6};

	//If any of the ground is cyan, avoid it.
	//Otherwise, just choose a direction that won't cause a run-in. 
	//Try to move in straight lines
	for (try_cell of random_permutation(CORNERS))
		if (view[try_cell].color === 1 && view[CCW[try_cell][4]].color !== 1) 
			return {cell:try_cell};
	for (try_cell of random_permutation(CORNERS))
		if (view[try_cell].color === 1)
			if (view[CCW[try_cell][2]].color !== 1 && view[CCW[try_cell][6]].color !== 1) 
				return {cell:try_cell};

	return {cell:0};
	
}

//Early-phase queen (when the queen and the gatherer are moving together at lightspeed, trying to find more food)
function early_queen()
{
	//Find the gatherer, revolve counterclockwise around her
	var gatherer_cell = null;
	for (try_cell of random_permutation(SCAN_MOVES))
	{
		if (is_ally(try_cell) && view[try_cell].ant.type === GATHERER)
		{
			gatherer_cell = try_cell;
			break;
		}
	}

	if (gatherer_cell === null || CORNERS.includes(gatherer_cell)) return {cell:4};

	//Once the gatherer is orthogonal to us, spawn a marcher
	if (EDGES.includes(gatherer_cell) && this_ant().food > 0) 
		return {cell:CCW[gatherer_cell][4], type:random_choice(.5)?MARCHER_A:MARCHER_B};

	return {cell:CCW[gatherer_cell][7]};
}

//Don't step on food or enemies. Instead, signal. 
function queen_step_watch(candidate)
{
	if (is_enemy(candidate.cell)) return {cell:4, color:UP_PANIC};
	if (is_ally(candidate.cell)) return {cell:4};
	return candidate;
}

function qdecide_two_edge_straight(corner)
{
	//One of the two is the gatherer, right?
	return {cell:4};
}

function qdecide_two_edge_bent(corner)
{
	return {cell:CCW[corner][2]};
}

function qdecide_edge_corner_skewed(corner)
{
	if (view[corner].ant.type === MARCHER_A) return {cell:CCW[corner][7], type:MARCHER_B};
	if (view[corner].ant.type === MARCHER_B) return {cell:CCW[corner][7], type:MARCHER_A};
	return sanitize(opening_queen(), FREE_ORDER);
}

function qdecide_three_march(corner)
{
	//Propogate signals

	var counts = [0,0,0,0,0,0,0,0,0]
	counts[view[4].color]++;
	counts[view[corner].color]++;
	counts[view[CCW[corner][1]].color]++;
	counts[view[CCW[corner][3]].color]++;

	//Try to trim away all but two colors, the primary and secondary color
	var primary = null;
	var secondary = null;
	var singular_colors = [];
	var pair_colors = [];
	for (var i = 1; i <= 8; i++)
	{
		if (counts[i] === 1) singular_colors.push(i);
		else if (counts[i] === 2) pair_colors.push(i);
	}

	for (var i = 1; i <= 8; i++)
	{
		if (counts[i] === 4) //Too easy
		{
			primary = i;
			secondary = UP_PANIC;
		}
		else if (counts[i] === 3) //Also too easy
		{
			primary = i;
			secondary = singular_colors[0];
		}
	}

	if (primary === null)
	{
		primary = multisig_precedence( (pair_colors.length === 0) ? singular_colors : pair_colors);
		secondary = based_precedence( primary, (pair_colors.length < 2) ? singular_colors : pair_colors);
	}

	//Now with those found

	//Reply to stalled with ready
	if (primary === DOWN_STALLED)
	{
		return {cell: 4, color:UP_READY};
	}
	
	return {cell:4, color:PRECEDENCES[primary][secondary]};
}

function qdecide_three_recover(corner)
{
	//With probability QUEEN_SPAWN_PROB, spawn a worker. 
	if (random_choice(QUEEN_SPAWN_PROB))
	{
		return {cell:CCW[corner][3]};
	}
	else
	{
		return {cell:4};
	}
}

function qdecide_three_queen_stand(corner)
{
	//Propogate signals

	var counts = [0,0,0,0,0,0,0,0,0]
	counts[view[4].color]++;
	counts[view[corner].color]++;
	counts[view[CCW[corner][1]].color]++;
	counts[view[CCW[corner][3]].color]++;

	//Try to trim away all but two colors, the primary and secondary color
	var primary = null;
	var secondary = null;
	var singular_colors = [];
	var pair_colors = [];
	for (var i = 1; i <= 8; i++)
	{
		if (counts[i] === 1) singular_colors.push(i);
		else if (counts[i] === 2) pair_colors.push(i);
	}

	for (var i = 1; i <= 8; i++)
	{
		if (counts[i] === 4) //Too easy
		{
			primary = i;
			secondary = 7;
		}
		else if (counts[i] === 3) //Also too easy
		{
			primary = i;
			secondary = singular_colors[0];
		}
	}

	if (primary === null)
	{
		primary = multisig_precedence( (pair_colors.length === 0) ? singular_colors : pair_colors);
		secondary = based_precedence( primary, (pair_colors.length < 2) ? singular_colors : pair_colors);
	}

	//Now with those found

	//Reply to stalled with ready
	if (primary === DOWN_STALLED)
	{
		return {cell: 4, color:UP_READY};
	}
	
	return {cell:4, color:PRECEDENCES[primary][secondary]};
}

function qdecide_three_gatherer_walk(corner)
{
	return {cell:4};
}

function queen_wait()
{
	var corner = view_corner();
	switch(neighbor_type(corner))
	{
		case ONE_EDGE:
		{
			if (this_ant().food > 1) return {cell:CCW[corner][3], type:GATHERER};
		}
		case EDGE_CORNER_LEFT:
		{
			if (view[corner].color === DOWN_GATHERER)
				if (view[CCW[corner][1]].color === DOWN_GATHERER || view[corner].ant.type === GATHERER)
					return {cell:4, color: DOWN_GATHERER};
			if (this_ant().food > 1) return {cell:CCW[corner][3], type:GATHERER};
		}
		break;
		case EDGE_CORNER_RIGHT:
		{
			if (view[corner].color === DOWN_GATHERER)
				if (view[CCW[corner][7]].color === DOWN_GATHERER || view[corner].ant.type === GATHERER)
					return {cell:4, color: DOWN_GATHERER};
			if (this_ant().food > 1) return {cell:CCW[corner][5], type:GATHERER};
		}
		break;
	}

	if (view[4].color !== UP_PANIC) return {cell:4, color:UP_PANIC};
	else return sanitize(opening_queen(), FREE_ORDER);
}

function queen_march()
{
	var corner = view_corner();
	switch (neighbor_type(corner))
	{
		case TWO_EDGE_STRAIGHT: return queen_step_watch(qdecide_two_edge_straight(corner));
		case TWO_EDGE_BENT: return queen_step_watch(qdecide_two_edge_bent(corner));
		case EDGE_CORNER_SKEWED: return queen_step_watch(qdecide_edge_corner_skewed(corner));
		case THREE_MARCH: return queen_step_watch(qdecide_three_march(corner));
		case THREE_RECOVER: return queen_step_watch(qdecide_three_recover(corner));
		case THREE_QUEEN_STAND: return queen_step_watch(qdecide_three_queen_stand(corner));
		case THREE_GATHERER_WALK: return queen_step_watch(qdecide_three_gatherer_walk(corner));
		default: return sanitize(early_queen(), LEFT_ORDER);
	}
}

function queen_decision()
{
	marcher_count = 0;
	gatherer_count = 0;
	for (try_cell of SCAN_MOVES)
	{
		if (is_ally(try_cell))
		{
			if (view[try_cell].ant.type === MARCHER_A || view[try_cell].ant.type === MARCHER_B)
				marcher_count++;
			if (view[try_cell].ant.type === GATHERER && is_other(try_cell))
				gatherer_count++;
		}
	}
	if (marcher_count > 0 && gatherer_count > 0)
	{
		return queen_step_watch(queen_march());
	}
	else if (marcher_count > 0)
	{
		return queen_step_watch(queen_wait());
	}
	else if (gatherer_count > 0)
	{
		return sanitize(early_queen(), RIGHT_ORDER);
	}
	else return sanitize(opening_queen(), FREE_ORDER);
}
