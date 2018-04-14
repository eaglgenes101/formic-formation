//Marchers A and B

function mdecide_one_corner(corner)
{
	if (view[corner].ant.type === QUEEN)
		return turn_color2(view[4].color, corner);
	else return sanitize(saboteur(), FREE_ORDER);
}

function mdecide_one_edge(corner)
{
	//This occurs when we march forward as the end, but the next corner neighbor is obstructed
	//Find this condition
	if (view[CCW[corner][1]].color === U_REALIGN)
	{
		if (view[CCW[corner][2]].food === 1) return {cell:corner};
		if (is_ally(CCW[corner][2]) && view[CCW[corner][2]].ant.type === GATHERER) return {cell:corner};
	}
	//Break away
	return sanitize(saboteur(), FREE_ORDER);
}

function mdecide_two_edge_bent(corner)
{
	//Eject in scenarios where we would otherwise deadlock
	if (view[CCW[corner][1]].ant.type === GATHERER && view[CCW[corner][3]].ant.type === QUEEN)	
		return sanitize(saboteur(), FREE_ORDER);
	if (view[CCW[corner][1]].ant.type === QUEEN && view[CCW[corner][3]].ant.type === GATHERER)	
		return sanitize(saboteur(), FREE_ORDER);

	var up_sig = view[CCW[corner][1]].color;
	var down_sig = view[CCW[corner][3]].color;
	
	//In recovery, do the moving step
	if (up_sig === D_STALLED && [D_STALLED, U_READY, D_GATHERER].includes(down_sig) && [D_STALLED, U_READY].includes(view[4].color))
		return turn_color2(D_STALLED, corner); 

	//Special case: when the queen is visible at CCW[corner][1], we may need to do signal transmission
	if (view[CCW[corner][1]].ant.type === QUEEN)
	{
		var provisional = linewatch(CCW[corner][4]);
		if (provisional !== null) return turn_color(provisional, CCW[corner][4]); 
		if (up_sig === D_GATHERER && down_sig === U_REALIGN && view[4].color === D_GATHERER)
			return turn_color(D_GATHERER, CCW[corner][4]); 
	}

	if (up_sig === U_SENTINEL)
	{
		if (down_sig === U_REALIGN && [D_MARCH, U_SENTINEL].includes(view[4].color)) 
			return turn_color2(U_SENTINEL, corner); 
		if (down_sig === D_STALLED && [U_SENTINEL, D_STALLED].includes(view[4].color)) 
			return turn_color2(U_SENTINEL, corner); 
		if (down_sig === D_MARCH && [U_SENTINEL, D_MARCH].includes(view[4].color)) 
			return turn_color2(D_MARCH, corner); 
	}

	if (up_sig === D_GATHERER && down_sig === D_STALLED && view[4].color === D_GATHERER)
		return turn_color2(D_STALLED, corner); 
	
	return {cell:CCW[corner][2]}; 
}

function mdecide_two_edge_straight(corner)
{
	//(Remember, we don't know if it's CCW[corner][1] or CCW[corner][5] that's upstream)
	return turn_color2(U_REALIGN, corner); 
}

function mdecide_edge_corner_left(corner)
{
	//Eject in scenarios where we would otherwise deadlock
	if (view[CCW[corner][1]].ant.type === GATHERER && view[corner].ant.type === QUEEN) return sanitize(saboteur(), FREE_ORDER);
	if (view[CCW[corner][1]].ant.type === QUEEN && view[corner].ant.type === GATHERER) return sanitize(saboteur(), FREE_ORDER);

	//Special logic for arranging corners correctly
	if (is_other(CCW[corner][1]) && view[corner].ant.type === QUEEN) return {cell:CCW[corner][3]};

	var down_sig = PAIRDOWNS[view[corner].color][view[CCW[corner][1]].color];

	var provisional = linewatch(CCW[corner][4]);
	if (provisional !== null) 
	{
		if (provisional === U_REALIGN) return turn_color(U_SENTINEL, CCW[corner][3]); 
		return turn_color(provisional, CCW[corner][3]); 
	}

	if (down_sig === U_REALIGN && [U_SENTINEL].includes(view[4].color))
	{
		if (view[corner].color === D_MARCH) return {cell:CCW[corner][2]};
		return turn_color(U_SENTINEL, CCW[corner][3]); 
	}
	if (down_sig === U_REALIGN && view[4].color === D_MARCH) return turn_color(U_SENTINEL, CCW[corner][3]); 
	if (down_sig === D_STALLED && [D_MARCH, D_STALLED].includes(view[4].color)) return turn_color(D_STALLED, CCW[corner][3]); 
	if (down_sig === D_STALLED && view[4].color === U_SENTINEL) return turn_color(U_SENTINEL, CCW[corner][3]); 
	if (down_sig === U_READY && view[4].color === D_STALLED)
	{
		if (view[CCW[corner][2]].color !== D_MARCH) return {cell:CCW[corner][2], color:D_MARCH};
		return turn_color(D_MARCH, CCW[corner][3]); 
	}
	if (down_sig === U_READY && view[4].color === U_SENTINEL) return turn_color(D_MARCH, CCW[corner][3]); 
	if (down_sig === D_GATHERER && view[4].color === D_GATHERER) return turn_color(D_STALLED, CCW[corner][3]); 

	//If none of the signals fit, go by the march
	return {cell:CCW[corner][2]};
	
}

function mdecide_edge_corner_right(corner)
{

	//Special logic do early-game correctly
	if (view[corner].ant.type === GATHERER && view[CCW[corner][7]].ant.type === QUEEN)
		if (is_ally(CCW[corner][4]) && view[CCW[corner][4]].ant.type !== this_ant().type)
			return {cell:CCW[corner][5]};

	var down_sig = PAIRDOWNS[view[corner].color][view[CCW[corner][7]].color];
	
	var provisional = linewatch(CCW[corner][4]);
	if (provisional !== null) 
	{
		if (provisional === U_REALIGN) return turn_color(U_SENTINEL, CCW[corner][3]); 
		return turn_color(provisional, CCW[corner][3]); 
	}
	if (down_sig === D_MARCH)
	{
		if (view[4].color === D_MARCH)
			return turn_color(D_MARCH, CCW[corner][3]); 
		if ([D_FOOD, D_GATHERER].includes(view[4].color))
			return turn_color(D_MARCH, CCW[corner][3]); 
	}
	if (down_sig === D_FOOD)
	{
		if ([U_SENTINEL, D_STALLED].includes(view[4].color))
			return turn_color(D_STALLED, CCW[corner][3]); 
		if ([D_FOOD, D_GATHERER].includes(view[4].color))
			return turn_color(D_STALLED, CCW[corner][3]);
	}
	if (down_sig === D_GATHERER)
	{
		if ([D_FOOD, D_GATHERER].includes(view[4].color))
			return turn_color(D_MARCH, CCW[corner][3]);
		if ([U_SENTINEL, D_STALLED].includes(view[4].color))
			return turn_color(D_STALLED, CCW[corner][3]); 
	}
	if (down_sig === D_STALLED)
	{
		if (view[4].color === D_STALLED)
			return turn_color(D_STALLED, CCW[corner][3]); 
		if ([D_FOOD, D_GATHERER].includes(view[4].color))
			return turn_color(D_STALLED, CCW[corner][3]);
	}
	if (down_sig === U_READY)
	{
		if (view[4].color === D_STALLED)
			return turn_color(D_MARCH, CCW[corner][3]); 
		if ([D_FOOD, D_GATHERER].includes(view[4].color))
			return turn_color(D_MARCH, CCW[corner][3]);
	}
	if (down_sig === U_REALIGN)
	{
		if (view[4].color === U_SENTINEL)
			return {cell:CCW[corner][6]};
		if ([D_FOOD, D_GATHERER].includes(view[4].color))
			return turn_color(D_STALLED, CCW[corner][3]);
	}

	return turn_color(down_sig, CCW[corner][3]); 
	
}

function mdecide_edge_corner_spawn(corner)
{
	if (view[corner].ant.type === QUEEN && view[corner].color === D_MARCH && view[CCW[corner][3]].color === D_STALLED)
		if (view[4].color === D_STALLED) return turn_color2(D_STALLED, corner); 
	return sanitize(saboteur(), FREE_ORDER);
}

function mdecide_three_march(corner)
{
	var down_sig = PAIRDOWNS[view[corner].color][view[CCW[corner][1]].color];
	var up_sig = view[CCW[corner][3]].color;
	//If we need to stay still, there will be U_SENTINEL near the top
	
	var provisional = linewatch2(corner);
	if (provisional !== null) return turn_color(provisional, corner); 
	
	if (up_sig === U_SENTINEL)
	{
		if (down_sig === D_GATHERER && [D_GATHERER, D_STALLED].includes(view[4].color))
			return turn_color(D_STALLED, corner); 
		if (down_sig === D_STALLED && [D_MARCH, D_STALLED].includes(view[4].color))
			return turn_color(D_STALLED, corner); 
	}
	if (up_sig === U_REALIGN)
	{
		if (down_sig === U_REALIGN && view[4].color === U_REALIGN)
			if (view[corner].color === U_SENTINEL)
			{
				if (view[CCW[corner][7]].color === D_MARCH) return turn_color(U_REALIGN, corner); 
				return {cell:CCW[corner][2]};
			}

		if (down_sig === D_FOOD && [D_MARCH, D_FOOD].includes(view[4].color))
			return turn_color(D_FOOD, corner);

		if (down_sig === U_READY && view[4].color === D_STALLED)
			return turn_color(D_MARCH, corner); 

		if (down_sig === D_STALLED && [D_MARCH, D_STALLED].includes(view[4].color))
			return turn_color(D_STALLED, corner); 

		if (down_sig === D_GATHERER && [D_GATHERER, D_STALLED].includes(view[4].color))
			return turn_color(D_STALLED, corner); 
	
		if (down_sig === D_MARCH && view[4].color === D_STALLED)
			return turn_color(D_STALLED, corner);
	}
	if (up_sig === D_MARCH)
	{
		if (down_sig === U_REALIGN && view[4].color === D_MARCH)
			if (view[corner].color === U_SENTINEL) return turn_color(U_REALIGN, corner); 

		if (down_sig === U_READY && view[4].color === U_READY)
			return turn_color(D_MARCH, corner); 
	}
	if (up_sig === D_STALLED)
	{
		if (down_sig === U_READY && view[4].color === D_STALLED)
			return turn_color(U_READY, corner); 

		if (down_sig === D_STALLED && [D_STALLED, D_MARCH].includes(view[4].color))
			return turn_color(D_STALLED, corner); 

		if (down_sig === D_GATHERER && view[4].color === D_GATHERER)
			return turn_color(D_STALLED, corner); 

		if (down_sig === D_MARCH && view[4].color === D_STALLED)
			return turn_color(D_STALLED, corner); 

		if (down_sig === U_REALIGN && [D_STALLED, D_MARCH].includes(view[4].color))
			return turn_color(D_STALLED, corner); 
	}

	if (up_sig === D_GATHERER && down_sig === D_STALLED && view[4].color === D_GATHERER)
		if (view[CCW[corner][3]].ant.type === QUEEN) return turn_color(D_STALLED, corner); 

	if (up_sig === D_FOOD && down_sig === D_FOOD && view[4].color === D_FOOD)
		return turn_color(D_FOOD, corner); 

	if ([D_FOOD, D_GATHERER].includes(up_sig) && down_sig === D_GATHERER && view[4].color === D_GATHERER)
		return turn_color(D_GATHERER, corner); 

	//If none matches our current situation, return
	return {cell:CCW[corner][2]};
	
}

function mdecide_three_stand(corner)
{
	var provisional = linewatch2(corner);
	if (provisional !== null) return turn_color2(provisional, corner); 
	
	var up_sig = view[CCW[corner][3]].color
	var down_sig = PAIRSIDES[view[corner].color][view[CCW[corner][7]].color];

	if (up_sig === U_REALIGN)
	{
		if ([D_MARCH, D_STALLED].includes(down_sig) && view[4].color === D_MARCH)
			return turn_color2(U_REALIGN, corner); 
		if (view[4].color === U_REALIGN) 
			return turn_color2(U_REALIGN, corner);
	}

	if (up_sig === D_MARCH && down_sig === U_REALIGN && view[4].color === D_MARCH)
		return turn_color2(U_REALIGN, corner); 

	if (up_sig === D_STALLED && [D_STALLED, U_REALIGN].includes(down_sig) && view[4].color === D_STALLED)
		return turn_color2(D_STALLED, corner); 
	
	//Else send the all clear signal
	return turn_color2(D_MARCH, corner); 
	
}

function mdecide_three_unstand(corner)
{
	//This is FOUR_STAIRS, but the gatherer jumped the gun here, 
	//or the corner is stalled 
	// ****
	// bA**
	// *Bqg
	// ****
	if (view[CCW[corner][5]].ant.type === QUEEN)
	{
		var provisional = linewatch(corner);
		if (provisional !== null) return turn_color(provisional, corner); 
		var down_sig = PAIRUPS[view[corner].color][view[CCW[corner][7]].color];
	
		return turn_color(down_sig, corner); 
	}
	else
	{
		var provisional = linewatch(CCW[corner][4]);
		if (provisional !== null) return turn_color(provisional, CCW[corner][4]); 

		var up_sig = view[CCW[corner][5]].color;
		var down_sig = PAIRDOWNS[view[corner].color][view[CCW[corner][7]].color];

		if (up_sig === D_MARCH)
		{
			if (down_sig === U_READY && view[4].color === U_READY)
				return turn_color(D_MARCH, CCW[corner][4]); 

			if (down_sig === D_FOOD && view[4].color === D_MARCH)
				return turn_color(U_REALIGN, CCW[corner][4]); 
			if ([D_FOOD, D_GATHERER].includes(view[4].color))
				return turn_color(D_MARCH, CCW[corner][4]);
		}
		if (up_sig === D_FOOD)
		{
			if (down_sig === D_FOOD && view[4].color === D_MARCH)
				return turn_color(U_REALIGN, CCW[corner][4]); 
			if ([D_FOOD, D_GATHERER].includes(view[4].color))
				return turn_color(D_STALLED, CCW[corner][4]);
		}
		if (up_sig === D_GATHERER)
		{
			if (down_sig === D_FOOD && view[4].color === D_MARCH)
				return turn_color(U_REALIGN, CCW[corner][4]); 
			if ([D_FOOD, D_GATHERER].includes(view[4].color))
				return turn_color(D_STALLED, CCW[corner][4]);
		}
		if (up_sig === D_STALLED)
		{
			if (down_sig === U_READY && view[4].color === D_STALLED)
				return turn_color(U_READY, CCW[corner][4]); 
			if (down_sig === D_GATHERER && view[4].color === D_GATHERER)
				return turn_color(D_STALLED, CCW[corner][4]); 
			if (down_sig === D_STALLED && view[4].color === D_STALLED)
				return turn_color(D_STALLED, CCW[corner][4]);

			if (down_sig === D_FOOD && view[4].color === D_MARCH)
				return turn_color(U_REALIGN, CCW[corner][4]); 
			if (view[4].color === D_FOOD)
				return turn_color(D_STALLED, CCW[corner][4]);
			if ([D_MARCH, D_FOOD, D_STALLED, U_REALIGN, U_READY].includes(down_sig) && view[4].color === D_GATHERER)
				return turn_color(D_STALLED, CCW[corner][4]);
		}
		if (up_sig === U_REALIGN)
		{
			if (down_sig === D_FOOD && view[4].color === D_MARCH)
				return turn_color(U_REALIGN, CCW[corner][4]); 
			if ([D_FOOD, D_GATHERER].includes(view[4].color))
				return turn_color(D_STALLED, CCW[corner][4]);
		}
		if (up_sig === U_SENTINEL)
		{
			if (down_sig === D_MARCH && view[4].color === U_SENTINEL)
				return turn_color(D_MARCH, CCW[corner][4]); 
			if ([D_FOOD, D_GATHERER].includes(down_sig) && view[4].color === U_REALIGN)
				return turn_color(D_STALLED, CCW[corner][4]); 
			if (down_sig === D_STALLED && view[4].color === U_SENTINEL)
				return turn_color(D_STALLED, CCW[corner][4]); 
			if (down_sig === U_READY && view[4].color === D_STALLED)
				return turn_color(U_READY, CCW[corner][4]); 

			if (down_sig === D_FOOD && view[4].color === D_MARCH)
				return turn_color(U_REALIGN, CCW[corner][4]); 
			if ([D_FOOD, D_GATHERER].includes(view[4].color))
				return turn_color(D_STALLED, CCW[corner][4]);
		}
		if (up_sig === U_READY)
		{
			if (down_sig === D_FOOD && view[4].color === D_MARCH)
				return turn_color(U_REALIGN, CCW[corner][4]); 
			if ([D_FOOD, D_GATHERER].includes(view[4].color))
				return turn_color(D_MARCH, CCW[corner][4]);
		}

		//Catch-all rule to resist deadlocking

		return turn_color(view[4].color, CCW[corner][4]); 
	}
}

function mdecide_three_recover(corner)
{
	//This should only happen in the middle of recovery
	return turn_color(U_SENTINEL, corner); 
}

function mdecide_three_hang(corner)
{
	return turn_color2(view[4].color, CCW[corner][4]); 
}

function mdecide_four_z(corner)
{
	//Under certain conditions, this can appear during recovery
	//But this is usually a normal-march thing, so check both sides for indicators
	var provisional = linewatch2(CCW[corner][4]);
	if (provisional !== null) return turn_color2(provisional, CCW[corner][4]); 

	var up_sig = PAIRSIDES[view[corner].color][view[CCW[corner][7]].color];
	var down_sig = PAIRSIDES[view[CCW[corner][4]].color][view[CCW[corner][3]].color];

	if (up_sig === D_FOOD)
	{
		if ([D_FOOD, D_STALLED, U_REALIGN].includes(down_sig) && view[4].color === U_REALIGN)
			return turn_color2(U_REALIGN, CCW[corner][4]);
		if (down_sig === D_GATHERER && [U_REALIGN, D_GATHERER].includes(view[4].color))
			return turn_color2(U_REALIGN, CCW[corner][4]);
	}

	if (up_sig === D_STALLED)
	{
		if (down_sig === U_REALIGN)
			return turn_color2(U_REALIGN, CCW[corner][4]); 
		if (down_sig === D_FOOD && view[4].color === U_REALIGN)
			return turn_color2(U_REALIGN, CCW[corner][4]);
	}

	if (up_sig === D_GATHERER)
	{
		if (down_sig === U_REALIGN && view[4].color === U_REALIGN)
			return turn_color2(D_STALLED, CCW[corner][4]); 
		if (down_sig === D_FOOD && [U_REALIGN, D_GATHERER].includes(view[4].color))
			return turn_color2(U_REALIGN, CCW[corner][4]);
	}

	if (up_sig === U_REALIGN)
	{
		if (down_sig === D_FOOD && view[4].color === U_REALIGN)
			return turn_color2(U_REALIGN, CCW[corner][4]); 
		if (down_sig === D_STALLED)
			return turn_color2(U_REALIGN, CCW[corner][4]); 
		if (down_sig === D_GATHERER && view[4].color === U_REALIGN)
			return turn_color2(D_STALLED, CCW[corner][4]); 
		if (down_sig === U_READY && view[4].color === U_REALIGN)
			return turn_color2(D_MARCH, CCW[corner][4]); 
	}

	if (up_sig === U_READY && down_sig === U_REALIGN && view[4].color === U_REALIGN)
		return turn_color2(D_MARCH, CCW[corner][4]); 

	return turn_color2(D_MARCH, CCW[corner][4]); 
}

function mdecide_four_stairs(corner)
{
	//This is a heavyweight. We are stalled, and therefore we become a transmission channel of sorts for 
	//all sorts of signals. The signals needs to be transmitted correctly for the whole gameplan to work out. 
	//No movement, though, so that doesn't need to be considered. 
	
	//Here, we have no idea if we're on the front or back of the formation. 
	// b**  ba*
	// aB*  *Ba
	// *ab  **b

	var provisional = linewatch2(corner);
	if (provisional !== null) return turn_color2(provisional, corner);

	var up_sig = PAIRSIDES[view[corner].color][view[CCW[corner][1]].color];
	var down_sig = PAIRSIDES[view[CCW[corner][4]].color][view[CCW[corner][3]].color];

	if (up_sig === D_MARCH)
	{
		if (down_sig === U_READY && view[4].color === U_READY)
			return turn_color2(D_MARCH, corner);
		if (down_sig === D_FOOD && view[4].color === D_MARCH)
			return turn_color2(D_FOOD, corner);
		if (down_sig === D_STALLED && view[4].color === D_MARCH)
			return turn_color2(D_STALLED, corner);
		if ([D_GATHERER, D_STALLED].includes(down_sig) && view[4].color === U_REALIGN)
			return turn_color2(D_STALLED, corner);
		if ([D_MARCH, D_FOOD, U_REALIGN, U_READY].includes(down_sig) && view[4].color === U_REALIGN)
			return turn_color2(D_MARCH, corner);
	}

	if (up_sig === D_FOOD)
	{
		if (down_sig === D_MARCH && view[4].color === D_MARCH)
			return turn_color2(D_FOOD, corner);
		if (down_sig === D_GATHERER && [U_REALIGN, D_GATHERER].includes(view[4].color))
			return turn_color2(D_FOOD, corner);
		if ([U_REALIGN, D_STALLED].includes(down_sig) && view[4].color === U_REALIGN)
			return turn_color2(D_STALLED, corner);
		if ([D_MARCH, U_READY].includes(down_sig) && view[4].color === U_REALIGN)
			return turn_color2(D_MARCH, corner);
		if (down_sig === U_READY && view[4].color === D_STALLED)
			return turn_color2(D_STALLED, corner);
	}

	if (up_sig === D_STALLED)
	{
		if (down_sig === D_STALLED && view[4].color === D_STALLED)
			return turn_color2(D_STALLED, corner);
		if (down_sig === U_READY && view[4].color === D_STALLED)
			return turn_color2(U_READY, corner);
		if ([D_MARCH, D_STALLED].includes(down_sig) && view[4].color === D_MARCH)
			return turn_color2(D_STALLED, corner);
		if (down_sig === U_REALIGN && [U_REALIGN, D_MARCH].includes(view[4].color))
			return turn_color2(D_STALLED, corner);
		if (down_sig === D_GATHERER && [D_STALLED, D_GATHERER].includes(view[4].color))
			return turn_color2(D_STALLED, corner);
		if ([D_FOOD, D_MARCH].includes(down_sig) && view[4].color === U_REALIGN)
			return turn_color2(D_STALLED, corner);
		if ([D_GATHERER, D_STALLED, U_READY].includes(down_sig) && view[4].color === U_REALIGN)
			return turn_color2(D_MARCH, corner);
	}

	if (up_sig === D_GATHERER)
	{
		if (down_sig === D_FOOD && [D_GATHERER, U_REALIGN].includes(view[4].color))
			return turn_color2(D_FOOD, corner);
		if (down_sig === U_READY && view[4].color === D_STALLED)
			return turn_color2(D_STALLED, corner);
		if ([D_MARCH, U_REALIGN].includes(down_sig) && view[4].color === U_REALIGN)
			return turn_color2(D_STALLED, corner);
		if (down_sig === D_STALLED && [D_STALLED, D_GATHERER].includes(view[4].color))
			return turn_color2(D_STALLED, corner);
		if ([D_GATHERER, D_STALLED, U_READY].includes(down_sig) && view[4].color === U_REALIGN)
			return turn_color2(D_STALLED, corner);
	}

	if (up_sig === U_REALIGN)
	{

		if ([D_STALLED, U_REALIGN].includes(down_sig) && view[4].color === D_MARCH)
			return turn_color2(D_STALLED, corner);
		if (down_sig === D_MARCH && view[4].color === U_REALIGN)
			return turn_color2(D_MARCH, corner);
		if (down_sig === U_REALIGN && view[4].color === U_REALIGN)
			return turn_color2(D_STALLED, corner);
		if ([D_FOOD, D_GATHERER, D_STALLED, U_READY].includes(down_sig) && view[4].color === U_REALIGN)
			return turn_color2(D_STALLED, corner);
	}

	if (up_sig === U_READY)
	{
		if (down_sig === D_STALLED && view[4].color === D_STALLED)
			return turn_color2(U_READY, corner);
		if (down_sig === D_MARCH && view[4].color === U_READY)
			return turn_color2(D_MARCH, corner);
		if ([D_FOOD, D_GATHERER].includes(down_sig) && view[4].color === D_STALLED)
			return turn_color2(D_STALLED, corner);
		if (down_sig === U_REALIGN && view[4].color === U_REALIGN)
			return turn_color2(D_STALLED, corner);
		if ([D_MARCH, D_FOOD, D_GATHERER, U_READY].includes(down_sig) && view[4].color === U_REALIGN)
			return turn_color2(U_READY, corner);
	}

	return turn_color2(view[4].color, corner);
	
}

//Don't step on food or enemies. Instead, signal. 
function marcher_step_watch(candidate)
{
	if (candidate.cell === 4) return candidate;
	if (candidate.hasOwnProperty("color")) return candidate;
	if (view[candidate.cell].food !== 0) return turn_color2(D_FOOD, 0);
	if (is_harvestable(candidate.cell)) return turn_color2(D_FOOD, 0);
	if (view[candidate.cell].ant !== null) return turn_color2(U_PANIC, 0);
	return candidate;
}

function marcher_decision()
{
	var gatherer_count = 0;
	var enemy_count = 0;
	for (try_cell of SCAN_MOVES)
	{
		if (is_ally(try_cell) && view[try_cell].ant.type === GATHERER) gatherer_count++;
		else if (is_enemy(try_cell) && !is_harvestable(try_cell))enemy_count++;
	}
	if (gatherer_count > 1 || enemy_count > 0) return sanitize(saboteur(), FREE_ORDER);
	var corner = view_corner();
	if (view[4].color === U_PANIC || this_ant().food > 0) return sanitize(saboteur(), FREE_ORDER);
	switch (neighbor_type(corner))
	{
		case ONE_CORNER: return marcher_step_watch(mdecide_one_corner(corner));
		case ONE_EDGE: return marcher_step_watch(mdecide_one_edge(corner));
		case TWO_EDGE_BENT: return marcher_step_watch(mdecide_two_edge_bent(corner));
		case TWO_EDGE_STRAIGHT: return marcher_step_watch(mdecide_two_edge_straight(corner));
		case EDGE_CORNER_LEFT: return marcher_step_watch(mdecide_edge_corner_left(corner));
		case EDGE_CORNER_RIGHT: return marcher_step_watch(mdecide_edge_corner_right(corner));
		case EDGE_CORNER_SPAWN: return marcher_step_watch(mdecide_edge_corner_spawn(corner));
		case THREE_MARCH: return marcher_step_watch(mdecide_three_march(corner));
		case THREE_STAND: return marcher_step_watch(mdecide_three_stand(corner));
		case THREE_RECOVER: return marcher_step_watch(mdecide_three_recover(corner));
		case THREE_UNSTAND: return marcher_step_watch(mdecide_three_unstand(corner));
		case THREE_HANG: return marcher_step_watch(mdecide_three_hang(corner));
		case FOUR_Z: return marcher_step_watch(mdecide_four_z(corner));
		case FOUR_STAIRS: return marcher_step_watch(mdecide_four_stairs(corner));
		default: return sanitize(saboteur(), FREE_ORDER);
	}
	
}

