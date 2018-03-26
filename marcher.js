/*

Marcher phase A and Marcher phase B are two sides of a coin. They operate almost identically, differing only in recognising their own kind as lockstepping buddies and the other kind as the ones they alternate with. 

The oldest marcher still in the formation initiates the signal. 

*/

function is_gatherer_marcher(cell)
{
	//First, check that the cell we called on is actually a gatherer in a corner
	if (!CORNERS.includes(cell) || !is_ally(cell) || view[cell].ant.type !== GATHERER) return false;

	lh_cell = CCW[cell][1];
	rh_cell = CCW[cell][7];

	//Look for queen nearby, and condition based on this
	if (is_ally(lh_cell) && view[lh_cell].ant.type === QUEEN) return !is_ally(rh_cell)
	else if (is_ally(rh_cell) && view[rh_cell].ant.type === QUEEN) return !is_ally(lh_cell)
	else return false;
}

function is_like(cell)
{
	if (CORNERS.includes(cell) && is_ally(cell))
	{
		switch(view[cell].ant.type)
		{
			case MARCHER_A: return view[cell].ant.food === 0 && this_ant().type === MARCHER_A;
			case MARCHER_B: return view[cell].ant.food === 0 && this_ant().type === MARCHER_B;
			case GATHERER: return is_gatherer_marcher(cell);
			case QUEEN: return true;
			default: return false;
		}
	}
	return false;
}

function is_other(cell)
{
	if (EDGES.includes(cell) && is_ally(cell))
	{
		switch(view[cell].ant.type)
		{
			case MARCHER_A: return view[cell].ant.food === 0 && this_ant().type === MARCHER_B;
			case MARCHER_B: return view[cell].ant.food === 0 && this_ant().type === MARCHER_A;
			case QUEEN: return true;
			default: return false;
		}
	}
	return false;
}

//Provides the top left corner of the corner. 
//The canonical view tries to position a corner into the upper left, or if there are no corners,
//tries to put an edge left. 
//Ambiguities are resolved by trying to maintain a counterclockwise ordering of neighbors starting from 0. 
function view_corner()
{
	//Count the number of corner neighbors
	var corners = [];
	for (try_cell of CORNERS)
		if (is_ally(try_cell) && is_like(try_cell)) corners.push(try_cell);
	var edges = [];
	for (try_cell of EDGES)
		if (is_ally(try_cell) && is_other(try_cell)) edges.push(try_cell);
	if (corners.length === 1) return corners[0];
	else if (corners.length === 2)
	{
		if (CCW[corners[0]][2] === corners[1]) return corners[0];
		else if (CCW[corners[1]][2] === corners[0]) return corners[1];
		else //Use edges
		{
			if (edges.length === 1)
			{
				if (CCW[corners[0]][1] === edges[0] || CCW[corners[0]][3] === edges[0])
					return corners[0];
				else return corners[1];
			}
			else if (edges.length === 2)
			{
				if (edges.includes(CCW[corners[1]][1])) return corners[1];
				else return corners[0];
			}
			else if (edges.length === 3)
			{
				if (edges.includes(CCW[corners[0]][1]) && edges.includes(CCW[corners[0]][3]))
					return corners[0];
				else return corners[1];
			}
			else return corners[0];
		}
	}
	else if (corners.length === 3) //Figure out which of the three is first
	{
		//You know what? Manual casework it is
		if (corners[0] === 0 && corners[1] === 2 && corners[2] === 6) return 2;
		else if (corners[0] === 0 && corners[1] === 2 && corners[2] === 8) return 8;
		else if (corners[0] === 0 && corners[1] === 6 && corners[2] === 8) return 0;
		else if (corners[0] === 2 && corners[1] === 6 && corners[2] === 8) return 6;
	}
	else
	{
		if (edges.length === 1) return CCW[edges[0]][7];
		else if (edges.length === 2)
		{
			//Try to position canonically
			if (CCW[edges[1]][2] === edges[0]) return CCW[edges[1]][7];
			else return CCW[edges[0]][7]; //Accept the ambiguity
		}
		else if (edges.length === 3)
		{
			//Just run the casework manually
			if (edges[0] === 1 && edges[1] === 3 && edges[2] === 5) return 8;
			else if (edges[0] === 1 && edges[1] === 3 && edges[2] === 7) return 2;
			else if (edges[0] === 1 && edges[1] === 5 && edges[2] === 7) return 6;
			else if (edges[0] === 3 && edges[1] === 5 && edges[2] === 7) return 0;
			else return 0; //Huh?
		}
		else return 0; //You're on your own here
	}
}
//Formation position constants
/****
  aB*
  ****/const ONE_EDGE = 0;
/****
  aB*
  *a**/const TWO_EDGE_BENT = 1;
/****
  aBa
  ****/const TWO_EDGE_STRAIGHT = 2;
/*b**
  aB*
  ****/const EDGE_CORNER_LEFT = 3;
/*ba*
  *B*
  ****/const EDGE_CORNER_RIGHT = 4;
/*b**
  aB*
  *a**/const THREE_MARCH = 5;
/*ba*
  *B*
  *a**/const THREE_STAND = 6;
/*b**
  aBa
  ****/const THREE_RECOVER = 7;
/*ba*
  *B*
  *ab*/const FOUR_Z = 8;
/*b**
  aB*
  *ab*/const FOUR_STAIRS = 9;

//Provides the formation number as enumerated above, or null if none apply, given the canonical corner
function neighbor_type(top_left)
{
	//Count the number of corner neighbors
	var corners = [];
	for (try_cell of CORNERS)
		if (is_ally(try_cell) && is_like(try_cell)) corners.push(try_cell);
	var edges = [];
	for (try_cell of EDGES)
		if (is_ally(try_cell) && is_other(try_cell)) edges.push(try_cell);
	if (corners.length === 0 && edges.length === 1) return ONE_EDGE;
	if (corners.length === 0 && edges.length === 2)
		return (edges[1] === CCW[edges[0]][4]) ? TWO_EDGE_STRAIGHT : TWO_EDGE_BENT;
	else if (corners.length === 1 && edges.length === 1)
	{
		if (edges[0] === CCW[top_left][1]) return EDGE_CORNER_LEFT 
		if (edges[0] === CCW[top_left][7]) return EDGE_CORNER_RIGHT;
		return null;
	}
	else if (corners.length === 1 && edges.length === 2)
	{
		if (edges.includes(CCW[top_left][1]) && edges.includes(CCW[top_left][3])) return THREE_MARCH;
		if (edges.includes(CCW[top_left][3]) && edges.includes(CCW[top_left][7])) return THREE_STAND;
		if (edges.includes(CCW[top_left][1]) && edges.includes(CCW[top_left][5])) return THREE_RECOVER;
		//Detect cases where a gatherer is going a walk along the line
		return null;
	}
	else if (corners.length === 2 && edges.length === 2)
	{
		if (edges.includes(CCW[top_left][3]) && edges.includes(CCW[top_left][7])) return FOUR_Z;
		if (edges.includes(CCW[top_left][1]) && edges.includes(CCW[top_left][3])) return FOUR_STAIRS;
		return null;
	}
	else return null;
}

// 10 functions to determine what to do for each of the 10 canonical views
// All other views cause dispatch to the saboteur routine

function decision_one_edge(corner)
{
	//This is only meaningful if the edge neighbor is a queen
	if (is_ally(CCW[corner][1]) && view[CCW[corner][1]].ant.type === QUEEN)
		return {cell:CCW[corner][2]};
	else //Break away
		return sanitize(saboteur(), FREE_ORDER);
}

function decision_two_edge_bent(corner)
{
	//TODO: Validate that we're in recovery, or one of the neighbors is a queen
	return {cell: CCW[corner][2]}; 
}

function decision_two_edge_straight(corner)
{
	//TODO: Validate that we're in recovery
	//Propogate UP_REALIGN
	//(Remember, we don't know if it's CCW[corner][1] or CCW[corner][5] that's upstream)
	return {cell:4, color:UP_REALIGN};
}

function decision_edge_corner_left(corner)
{
	//Marching, or recovering? 
	//Guess by sampling ourselves and our two neighbors for UP_REALIGN
	var num_realigning_neighbors = 0;
	var num_ready_neighbors = 0;
	if (view[4].color === UP_REALIGN) num_realigning_neighbors++;
	if (view[corner].color === UP_REALIGN) num_realigning_neighbors++;
	if (view[CCW[corner][1]].color === UP_REALIGN) num_realigning_neighbors++;
	if (view[4].color === UP_READY) num_ready_neighbors++;
	if (view[corner].color === UP_READY) num_ready_neighbors++;
	if (view[CCW[corner][1]].color === UP_READY) num_ready_neighbors++;

	if (num_realigning_neighbors > 1) return {cell:4, color:UP_REALIGN_END};
	if (num_ready_neighbors > 1) return {cell:4, color:UP_READY};

	//If none of the signals fit, go by the march
	return {cell:CCW[corner][2]};
	
}

function decision_edge_corner_right(corner)
{
	//Marching, or recovering? 
	//Guess by sampling ourselves and our two neighbors for UP_REALIGN
	var num_realigning_neighbors = 0;
	var num_ready_neighbors = 0;

	if (view[4].color === UP_REALIGN) num_realigning_neighbors++;
	if (view[corner].color === UP_REALIGN) num_realigning_neighbors++;
	if (view[CCW[corner][7]].color === UP_REALIGN) num_realigning_neighbors++;
	if (view[4].color === UP_READY) num_ready_neighbors++;
	if (view[corner].color === UP_READY) num_ready_neighbors++;
	if (view[CCW[corner][7]].color === UP_READY) num_ready_neighbors++;

	if (num_realigning_neighbors > 1) return {cell:4, color:UP_REALIGN_END};
	if (num_ready_neighbors > 1) return {cell:4, color:UP_READY};

	//If none of the signals fit, go the color
	return {cell:4, color:DOWN_MARCH};
	
}

function decision_three_march(corner)
{
	//If we need to stay still, there will be UP_REALIGN_END at the hanging edge
	//First, read up on the colors
	var corner_color = view[corner].color //Needed?
	var attached_edge_color = view[CCW[corner][1]].color //Needed?
	var hanging_edge_color = view[CCW[corner][3]].color

	//Then decide
	if (hanging_edge_color === UP_REALIGN_END) return {cell:4, color:UP_REALIGN};

	//If neither matches our current situation, return
	return {cell:CCW[corner][2]};
	
}

function decision_three_stand(corner)
{
	//We stay still here. But which signal do we send?
	//If we're surrounded by UP_REALIGN, then send that
	var num_realigning_neighbors = 0;
	if (view[4].color === UP_REALIGN) num_realigning_neighbors++;
	if (view[corner].color === UP_REALIGN) num_realigning_neighbors++;
	if (view[CCW[corner][3]].color === UP_REALIGN) num_realigning_neighbors++;
	if (view[CCW[corner][7]].color === UP_REALIGN) num_realigning_neighbors++;

	if (num_realigning_neighbors > 1) return {cell:4, color:UP_REALIGN_END};
	
	//Else send the all clear signal
	return {cell:4, color:DOWN_MARCH};
	
}

function decision_three_recover(corner)
{
	//This should only happen in the middle of recovery
	return {cell:4, color:UP_REALIGN};
}

function decision_four_z(corner)
{
	//Read all four colors, then choose the correct one
	var num_realigning_neighbors = 0;
	var num_stalled_neighbors = 0;

	if (view[4].color === UP_REALIGN) num_realigning_neighbors++;
	if (view[corner].color === UP_REALIGN) num_realigning_neighbors++;
	if (view[CCW[corner][3]].color === UP_REALIGN) num_realigning_neighbors++;
	if (view[CCW[corner][4]].color === UP_REALIGN) num_realigning_neighbors++;
	if (view[CCW[corner][7]].color === UP_REALIGN) num_realigning_neighbors++;

	if (view[4].color === DOWN_STALLED) num_stalled_neighbors++;
	if (view[corner].color === DOWN_STALLED) num_stalled_neighbors++;
	if (view[CCW[corner][3]].color === DOWN_STALLED) num_stalled_neighbors++;
	if (view[CCW[corner][4]].color === DOWN_STALLED) num_stalled_neighbors++;
	if (view[CCW[corner][7]].color === DOWN_STALLED) num_stalled_neighbors++;

	//Now, determine which to send
	if (num_realigning_neighbors > 1 && num_realigning_neighbors > num_stalled_neighbors) return {cell:4, color:UP_REALIGN};
	if (num_stalled_neighbors > 1) return {cell:4, color:DOWN_STALLED};
	return {cell:4, color:DOWN_MARCH};
	
}

function decision_four_stairs(corner)
{
	//This pattern, though always still, is most complex, since most signalling happens along this pattern
	//First, get the color counts in ourself and the surrounding neighbors, since we'll need it all we can get. 
	var counts = new Array(8);
	counts[view[4].color]++;
	counts[view[corner].color]++;
	counts[view[CCW[corner][1]]]++;
	counts[view[CCW[corner][3]]]++;
	counts[view[CCW[corner][4]]]++;

	//Try to trim away all but two colors, the primary and secondary color
	var primary = null;
	var secondary = null;
	var singular_colors = [];
	var pair_colors = [];
	for (var i = 0; i < 8; i++)
	{
		if (counts[i] === 1) singular_colors.push(i);
		else if (counts[i] === 2) pair_colors.push(i);
	}

	for (var i = 0; i < 8; i++)
		if (counts[i] === 5) //Too easy
		{
			primary = i;
			secondary = 7;
		}
		else if (counts[i] === 4) //Also too easy
		{
			primary = i;
			secondary = singular_colors[0];
		}
		else if (counts[i] === 3)
		{
			primary = i;
			if (singular_colors.length === 2) secondary = based_precedence(primary, singular_colors);
			else secondary = pair_colors[0];
		}

	if (primary === null)
	{
		primary = multisig_precedence( (pair_colors.length === 0) ? singular_colors : pair_colors);
		secondary = based_precedence( primary, (pair_colors.length < 2) ? singular_colors : pair_colors);
	}

	//Now with those found
	if ((primary === 0 || secondary === 0))
	{
		if (view[CCW[corner][5]].food === 1) return {cell:4, color:DOWN_FOOD};
		if (view[CCW[corner][6]].food === 1) return {cell:4, color:DOWN_FOOD};
		if (view[CCW[corner][7]].food === 1) return {cell:4, color:UP_REALIGN};
		if (is_enemy(CCW[corner][6])) return {cell:4, color:UP_PANIC};
	}
	if ((primary === 1 || secondary === 1))
	{
		if (view[CCW[corner][6]].food === 1) return {cell:4, color:UP_REALIGN};
		if (is_ally(CCW[corner][5]) && view[CCW[corner][5]].ant.type === GATHERER) return {cell:4, color:DOWN_GATHERER};
		if (is_ally(CCW[corner][6]) && view[CCW[corner][6]].ant.type === GATHERER) return {cell:4, color:DOWN_GATHERER};
		if (is_ally(CCW[corner][7]) && view[CCW[corner][7]].ant.type === GATHERER) return {cell:4, color:DOWN_GATHERER};
	}
	if ((primary === 4 || secondary === 4))
	{
		if (view[CCW[corner][6]].food === 1) return {cell:4, color:UP_REALIGN};
		if (is_ally(CCW[corner][5]) && view[CCW[corner][5]].ant.type === GATHERER) return {cell:4, color:DOWN_GATHERER};
		if (is_ally(CCW[corner][6]) && view[CCW[corner][6]].ant.type === GATHERER) return {cell:4, color:DOWN_GATHERER};
		if (is_ally(CCW[corner][7]) && view[CCW[corner][7]].ant.type === GATHERER) return {cell:4, color:DOWN_GATHERER};
	}
	
	return {cell:4, color:PRECEDENCE[primary][secondary]};
	
	
}

//Don't step on food or enemies. Instead, signal. 
function marcher_step_watch(candidate)
{
	if (candidate.cell === 4) return candidate;
	if (view[candidate.cell].food !== 0) return {cell:4, color:DOWN_FOOD};
	if (is_harvestable(candidate.cell)) return {cell:4, color:DOWN_FOOD};
	if (view[candidate.cell].ant !== null) return {cell:4, color:UP_PANIC};
}

function marcher_decision()
{
	//TODO: Figure out how this is broken
	var corner = view_corner();
	if (this_ant().food > 0) return sanitize(saboteur(), FREE_ORDER);
	switch (neighbor_type(corner))
	{
		case ONE_EDGE: return marcher_step_watch(decision_one_edge(corner));
		case TWO_EDGE_BENT: return matcher_step_watch(decision_two_edge_bent(corner));
		case TWO_EDGE_STRAIGHT: return marcher_step_watch(decision_two_edge_straight(corner));
		case EDGE_CORNER_LEFT: return marcher_step_watch(decision_edge_corner_left(corner));
		case EDGE_CORNER_RIGHT: return marcher_step_watch(decision_edge_corner_right(corner));
		case THREE_MARCH: return marcher_step_watch(decision_three_march(corner));
		case THREE_STAND: return marcher_step_watch(decision_three_stand(corner));
		case THREE_RECOVER: return marcher_step_watch(decision_three_recover(corner));
		case FOUR_Z: return marcher_step_watch(decision_four_z(corner));
		case FOUR_STAIRS: return marcher_step_watch(decision_four_stairs(corner));
		default: return sanitize(saboteur(), FREE_ORDER);
	}
	
}










