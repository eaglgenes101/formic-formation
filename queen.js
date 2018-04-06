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

	//If the color at the current cell is 1 (white), color it 8 (black)
	if (view[4].color !== 8) return {cell: 4, color: 8};

	//If any of the ground is black, avoid it.
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

	//To prevent gliding spins, color our own cell white if it's yellow
	if (view[4].color === DOWN_FOOD) return {cell:4, color:DOWN_MARCH};

	//Once the gatherer is orthogonal to us, spawn a marcher
	if (EDGES.includes(gatherer_cell) && this_ant().food > 2) 
		return {cell:CCW[gatherer_cell][1], type:random_choice(.5)?MARCHER_A:MARCHER_B};

	return {cell:CCW[gatherer_cell][7]};
}

//Don't step on food or enemies. Instead, signal. 
function queen_step_watch(candidate)
{
	if (candidate.hasOwnProperty("type") && this_ant().food === 0) return {cell:4, color:UP_PANIC};
	if (candidate.cell === 4) return candidate;
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
	var upstream = PAIRUPS[view[corner].color][view[CCW[corner][1]].color];

	//Now with those found

	//Reply to stalled with ready
	/*
	if (upstream === DOWN_STALLED && view[CCW[corner][3]].color === UP_READY)
	{
		return {cell: 4, color:UP_READY};
	}
	
	return {cell:4, color:PUTPRECS[view[CCW[corner][3]].color][upstream]};
	*/
	return {cell:4};
}

function qdecide_three_recover(corner)
{
	//The gatherer jumped the gun here
	//If the signal is a food signal or a gatherer signal, don't move
	/*
	var upstream = PAIRUPS[view[corner].color][view[CCW[corner][1]].color];

	if (upstream === DOWN_FOOD)
		return {cell:4, color:DOWN_FOOD};
	if (upstream === DOWN_GATHERER)
		return {cell:4, color:DOWN_GATHERER};*/
	
	//With probability, spawn a worker. 
	//Probability of spawning a worker is dependent on the queen's food stores. 
	//The more food, the less eager the spawning. 
	if (this_ant().food > 0 && [DOWN_STALLED, UP_READY].includes(upstream))
	{
		var one_minus_prob = 1-QUEEN_SPAWN_PROB_MIN
		var food_coefficient = QUEEN_SPAWN_PROB_DECAY/one_minus_prob
		var actual_prob = one_minus_prob/(food_coefficient*(this_ant().food-1)+1) + QUEEN_SPAWN_PROB_MIN;
		if (random_choice(actual_prob))
			return {cell:CCW[corner][3]};
	}

	var provisional = linewatch(corner)
	if (provisional !== null) return provisional;
	return {cell:4};
}

function qdecide_three_queen_stand(corner)
{
	/*
	var upstream = PAIRUPS[view[corner].color][view[CCW[corner][7]].color];

	//Now with those found

	//Reply to stalled with ready
	if (upstream === DOWN_STALLED && view[CCW[corner][5]].color === UP_READY)
	{
		return {cell: 4, color:UP_READY};
	}
	
	return {cell:4, color:upstream};*/
	return {cell:4};
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
		break;
		case EDGE_CORNER_LEFT:
		{
			/*if (view[corner].color === DOWN_GATHERER)
			{
				if ([DOWN_GATHERER, DOWN_STALLED].includes(view[CCW[corner][1]].color))
					return {cell:4, color: DOWN_GATHERER};
				if (view[corner].ant.type === GATHERER)
					return {cell:4, color:DOWN_GATHERER};
				if (true)
					return {cell:4, color:DOWN_GATHERER};
			}*/
			if (this_ant().food > 1) return {cell:CCW[corner][3], type:GATHERER};
		}
		break;
		case EDGE_CORNER_RIGHT:
		{
			/*if (view[corner].color === DOWN_GATHERER)
			{
				if ([DOWN_GATHERER, DOWN_STALLED].includes(view[CCW[corner][7]].color))
					return {cell:4, color: DOWN_GATHERER};
				if (view[corner].ant.type === GATHERER)
					return {cell:4, color:DOWN_GATHERER};
				if (true)
					return {cell:4, color:DOWN_GATHERER};
			}*/
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
			if (view[try_cell].ant.type === GATHERER && (EDGES.includes(try_cell) || is_gatherer_marcher(try_cell)))
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
