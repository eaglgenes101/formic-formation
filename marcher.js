//Marchers A and B

function mdec_one_corner(c)
{
	if (view[c].ant.type === QUEEN)
		return sigc2(view[4].color, c);
	else return sanitize(saboteur(), FREE_ORDER);
}

function mdec_one_edge(c)
{
	//This occurs when we march forward as the end, but the next c neighbor is obstructed
	//Find this condition
	if ([U_REALIGN, D_MARCH].includes(view[CCW[c][1]].color))
	{
		if (view[CCW[c][2]].food === 1) return {cell:c};
		if (is_ally(CCW[c][2]) && view[CCW[c][2]].ant.type === GATHERER) return {cell:c};
	}
	//Break away
	return sanitize(saboteur(), FREE_ORDER);
}

function mdec_ee_bent(c)
{
	//Eject in scenarios where we would otherwise deadlock
	if (view[CCW[c][1]].ant.type === GATHERER && view[CCW[c][3]].ant.type === QUEEN)	
		return sanitize(saboteur(), FREE_ORDER);
	if (view[CCW[c][1]].ant.type === QUEEN && view[CCW[c][3]].ant.type === GATHERER)	
		return sanitize(saboteur(), FREE_ORDER);

	var u_sig = view[CCW[c][1]].color;
	var d_sig = view[CCW[c][3]].color;

	//Keep still to assist spawning
	if (is_ally(c) && view[c].ant.type === GATHERER)
		return sigc(view[4].color, CCW[c][4]);
	
	//In recovery, do the moving step
	if (u_sig === D_STALLED)
	{
		if ([D_STALLED, U_READY, D_GATHERER].includes(d_sig) && [D_STALLED, U_READY].includes(view[4].color))
			return sigc2(D_STALLED, c); 
		if (d_sig === U_REALIGN && view[4].color === D_STALLED)
			return sigc2(D_STALLED, c); 
	}

	//Special case: when the queen is visible at CCW[c][1], we may need to do signal transmission
	if (view[CCW[c][1]].ant.type === QUEEN)
	{
		var provisional = lchk(CCW[c][4]);
		if (provisional !== null) return sigc(provisional, CCW[c][4]); 
		if (u_sig === D_GATHERER && d_sig === U_REALIGN && view[4].color === D_GATHERER)
			return sigc(D_GATHERER, CCW[c][4]); 
	}

	if (u_sig === U_SENTINEL)
	{
		if (d_sig === U_REALIGN && [D_MARCH, U_SENTINEL].includes(view[4].color)) 
			return sigc2(U_SENTINEL, c); 
		if (d_sig === D_STALLED && [U_SENTINEL, D_STALLED].includes(view[4].color)) 
			return sigc2(U_SENTINEL, c); 
		if (d_sig === D_MARCH && [U_SENTINEL, D_MARCH].includes(view[4].color)) 
			return sigc2(D_MARCH, c); 
	}

	if (u_sig === D_GATHERER && d_sig === D_STALLED && view[4].color === D_GATHERER)
		return sigc2(D_STALLED, c); 
	
	return {cell:CCW[c][2]}; 
}

function mdec_ee_straight(c)
{
	return sigc2(U_REALIGN, c); 
}

function mdec_ec_left(c)
{
	//Eject in scenarios where we would otherwise deadlock
	if (view[CCW[c][1]].ant.type === GATHERER && view[c].ant.type === QUEEN) return sanitize(saboteur(), FREE_ORDER);
	if (view[CCW[c][1]].ant.type === QUEEN && view[c].ant.type === GATHERER) return sanitize(saboteur(), FREE_ORDER);

	if (is_other(CCW[c][1]) && view[c].ant.type === QUEEN) return {cell:CCW[c][3]};

	var d_sig = PDOWNS[view[c].color][view[CCW[c][1]].color];

	//Special logic for spawning workers correctly
	if (is_ally(CCW[c][4]) && view[CCW[c][4]].ant.type === GATHERER && d_sig === D_STALLED && view[4].color === D_STALLED)
		return sigc(D_STALLED, CCW[c][7]);

	var provisional = lchk(CCW[c][4]);
	if (provisional !== null) 
	{
		if (provisional === U_REALIGN) return sigc(U_SENTINEL, CCW[c][3]); 
		return sigc(provisional, CCW[c][3]); 
	}
	if (d_sig === U_REALIGN)
	{
		if (view[4].color === D_MARCH) return sigc(U_SENTINEL, CCW[c][3]); 
		if (view[4].color === U_SENTINEL)
		{
			if (view[c].color === D_MARCH) return {cell:CCW[c][2]};
			return sigc(U_SENTINEL, CCW[c][3]); 
		}
	}
	if (d_sig === D_STALLED)
	{
		if ([D_MARCH, D_STALLED].includes(view[4].color)) return sigc(D_STALLED, CCW[c][3]); 
		if (view[4].color === U_SENTINEL) return sigc(U_SENTINEL, CCW[c][3]); 
	}
	if (d_sig === D_GATHERER)
	{
		if (view[4].color === D_FOOD) return sigc(D_GATHERER, CCW[c][3]);
		if (view[4].color === D_GATHERER) return sigc(D_STALLED, CCW[c][3]); 
	}
	if (d_sig === U_READY)
	{
		if (view[4].color === D_STALLED)
		{
			if (view[CCW[c][2]].color !== D_MARCH) return {cell:CCW[c][2], color:D_MARCH};
			return sigc(D_MARCH, CCW[c][3]); 
		}
		if (view[4].color === U_SENTINEL) return sigc(D_MARCH, CCW[c][3]); 
	}

	//If none of the signals fit, go by the march
	return {cell:CCW[c][2]};
	
}

function mdec_ec_right(c)
{
	//Special logic do early-game correctly
	if (view[c].ant.type === GATHERER && view[CCW[c][7]].ant.type === QUEEN)
		if (is_ally(CCW[c][4]) && view[CCW[c][4]].ant.type !== this_ant().type) return {cell:CCW[c][5]};

	var d_sig = PDOWNS[view[c].color][view[CCW[c][7]].color];
	
	var provisional = lchk(CCW[c][4]);
	if (provisional !== null) 
	{
		if (provisional === U_REALIGN) return sigc(U_SENTINEL, CCW[c][3]); 
		return sigc(provisional, CCW[c][3]); 
	}
	if (d_sig === D_MARCH)
	{
		if (view[4].color === D_MARCH) return sigc(D_MARCH, CCW[c][3]); 
		if ([D_FOOD, D_GATHERER, U_READY].includes(view[4].color)) return sigc(D_MARCH, CCW[c][3]); 
	}
	if (d_sig === D_FOOD)
	{
		if ([U_SENTINEL, D_STALLED].includes(view[4].color)) return sigc(D_STALLED, CCW[c][3]); 
		if ([D_FOOD, D_GATHERER, U_READY].includes(view[4].color)) return sigc(D_STALLED, CCW[c][3]);
	}
	if (d_sig === D_GATHERER)
	{
		if ([D_FOOD, D_GATHERER, U_READY].includes(view[4].color)) return sigc(D_MARCH, CCW[c][3]);
		if ([U_SENTINEL, D_STALLED].includes(view[4].color)) return sigc(D_STALLED, CCW[c][3]); 
	}
	if (d_sig === D_STALLED)
	{
		if (view[4].color === D_STALLED) return sigc(D_STALLED, CCW[c][3]); 
		if ([D_FOOD, D_GATHERER, U_READY].includes(view[4].color)) return sigc(D_STALLED, CCW[c][3]);
	}
	if (d_sig === U_READY)
	{
		if (view[4].color === D_STALLED) return sigc(D_MARCH, CCW[c][3]); 
		if ([D_FOOD, D_GATHERER, U_READY].includes(view[4].color)) return sigc(D_MARCH, CCW[c][3]);
	}
	if (d_sig === U_REALIGN)
	{
		if (view[4].color === U_SENTINEL) return {cell:CCW[c][6]};
		if ([D_FOOD, D_GATHERER, U_READY].includes(view[4].color)) return sigc(D_STALLED, CCW[c][3]);
	}

	return sigc(d_sig, CCW[c][3]); 
	
}

function mdec_ec_spawn(c)
{
	if (view[c].ant.type === QUEEN && view[c].color === D_MARCH && view[CCW[c][3]].color === D_STALLED)
		if (view[4].color === D_STALLED) return sigc2(D_STALLED, c); 
	return sanitize(saboteur(), FREE_ORDER);
}

function mdec_three_march(c)
{
	var d_sig = PDOWNS[view[c].color][view[CCW[c][1]].color];
	var u_sig = view[CCW[c][3]].color;
	//If we need to stay still, there will be U_SENTINEL near the top
	
	var provisional = lchk2(c);
	if (provisional !== null) return sigc(provisional, c); 
	
	if (u_sig === U_SENTINEL)
	{
		if (d_sig === D_GATHERER && [D_GATHERER, D_STALLED].includes(view[4].color))
			return sigc(D_STALLED, c); 
		if (d_sig === D_STALLED && [D_MARCH, D_STALLED].includes(view[4].color))
			return sigc(D_STALLED, c); 
	}
	if (u_sig === U_REALIGN)
	{
		if (d_sig === U_REALIGN && view[4].color === U_REALIGN)
			if (view[c].color === U_SENTINEL)
			{
				if (view[CCW[c][7]].color === D_MARCH) return sigc(U_REALIGN, c); 
				return {cell:CCW[c][2]};
			}

		if (d_sig === D_FOOD && [D_MARCH, D_FOOD].includes(view[4].color)) return sigc(D_FOOD, c);
		if (d_sig === U_READY && view[4].color === D_STALLED) return sigc(D_MARCH, c); 
		if (d_sig === D_STALLED && [D_MARCH, D_STALLED].includes(view[4].color)) return sigc(D_STALLED, c);
		if (d_sig === D_GATHERER && [D_GATHERER, D_STALLED].includes(view[4].color)) return sigc(D_STALLED, c); 
		if (d_sig === D_MARCH && view[4].color === D_STALLED) return sigc(D_STALLED, c);
	}
	if (u_sig === D_MARCH)
	{
		if (d_sig === U_REALIGN && view[4].color === D_MARCH)
			if (view[c].color === U_SENTINEL) return sigc(U_REALIGN, c); 
		if (d_sig === U_READY && view[4].color === U_READY) return sigc(D_MARCH, c); 
	}
	if (u_sig === D_STALLED)
	{
		if (d_sig === U_READY && view[4].color === D_STALLED) return sigc(U_READY, c); 
		if (d_sig === D_STALLED && [D_STALLED, D_MARCH].includes(view[4].color)) return sigc(D_STALLED, c); 
		if (d_sig === D_GATHERER && view[4].color === D_GATHERER) return sigc(D_STALLED, c); 
		if (d_sig === D_MARCH && view[4].color === D_STALLED) return sigc(D_STALLED, c); 
		if (d_sig === U_REALIGN && [D_STALLED, D_MARCH].includes(view[4].color)) return sigc(D_STALLED, c); 
	}
	if (u_sig === D_GATHERER)
	{
		if (d_sig === D_STALLED && view[4].color === D_GATHERER)
			if (view[CCW[c][3]].ant.type === QUEEN) return sigc(D_STALLED, c); 
		if (d_sig === D_GATHERER && view[4].color === D_GATHERER) return sigc(D_GATHERER, c); 
		if (d_sig === D_FOOD && view[4].color === D_GATHERER) return sigc(D_FOOD, c); 
	}
	if (u_sig === D_FOOD)
	{
		if (d_sig === D_FOOD && view[4].color === D_FOOD) return sigc(D_FOOD, c); 
		if (d_sig === D_GATHERER && view[4].color === D_GATHERER) return sigc(D_GATHERER, c); 
	}

	return {cell:CCW[c][2]};
	
}

function mdec_three_stand(c)
{
	var provisional = lchk2(c);
	if (provisional !== null) return sigc2(provisional, c); 
	
	var u_sig = view[CCW[c][3]].color
	var d_sig = PSIDES[view[c].color][view[CCW[c][7]].color];

	if (u_sig === U_REALIGN)
	{
		if ([D_MARCH, D_STALLED].includes(d_sig) && view[4].color === D_MARCH) return sigc2(U_REALIGN, c); 
		if (view[4].color === U_REALIGN) return sigc2(U_REALIGN, c);
	}
	if (u_sig === D_MARCH && d_sig === U_REALIGN && view[4].color === D_MARCH)
		return sigc2(U_REALIGN, c); 
	if (u_sig === D_STALLED && [D_STALLED, U_REALIGN].includes(d_sig) && view[4].color === D_STALLED)
		return sigc2(D_STALLED, c); 
	
	return sigc2(D_MARCH, c); 
	
}

function mdec_three_unstand(c)
{
	if (view[CCW[c][5]].ant.type === QUEEN)
	{
		var provisional = lchk(c);
		if (provisional !== null) return sigc(provisional, c); 
		var d_sig = PUPS[view[c].color][view[CCW[c][7]].color];
		return sigc(d_sig, c); 
	}
	else
	{
		var provisional = lchk(CCW[c][4]);
		if (provisional !== null) return sigc(provisional, CCW[c][4]); 

		var u_sig = view[CCW[c][5]].color;
		var d_sig = PDOWNS[view[c].color][view[CCW[c][7]].color];

		if (u_sig === D_MARCH)
		{
			if (d_sig === U_READY && view[4].color === U_READY) return sigc(D_MARCH, CCW[c][4]); 
			if (d_sig === D_FOOD && view[4].color === D_MARCH) return sigc(U_REALIGN, CCW[c][4]); 
			if ([D_FOOD, D_GATHERER].includes(view[4].color)) return sigc(D_MARCH, CCW[c][4]);
		}
		if (u_sig === D_FOOD)
		{
			if (d_sig === D_FOOD && view[4].color === D_MARCH) return sigc(U_REALIGN, CCW[c][4]); 
			if ([D_FOOD, D_GATHERER].includes(view[4].color)) return sigc(D_STALLED, CCW[c][4]);
		}
		if (u_sig === D_GATHERER)
		{
			if (d_sig === D_FOOD && view[4].color === D_MARCH) return sigc(U_REALIGN, CCW[c][4]); 
			if ([D_FOOD, D_GATHERER].includes(view[4].color)) return sigc(D_STALLED, CCW[c][4]);
		}
		if (u_sig === D_STALLED)
		{
			if (d_sig === U_READY)
			{
				if (view[4].color === D_STALLED) return sigc(U_READY, CCW[c][4]); 
				if (view[4].color === D_GATHERER) return sigc(D_STALLED, CCW[c][4]);
			}
			if (d_sig === D_FOOD)
			{
				if (view[4].color === D_MARCH) return sigc(U_REALIGN, CCW[c][4]); 
				if (view[4].color === D_GATHERER) return sigc(D_STALLED, CCW[c][4]);
			}
			if (d_sig === D_STALLED)
			{
				if (view[4].color === D_STALLED) return sigc(D_STALLED, CCW[c][4]);
				if (view[4].color === D_GATHERER) return sigc(D_STALLED, CCW[c][4]);
			}
			if (d_sig === D_GATHERER && view[4].color === D_GATHERER) return sigc(D_STALLED, CCW[c][4]); 
			if ([D_MARCH, U_REALIGN].includes(d_sig) && view[4].color === D_GATHERER) return sigc(D_STALLED, CCW[c][4]);
			if (view[4].color === D_FOOD) return sigc(D_STALLED, CCW[c][4]);
		}
		if (u_sig === U_REALIGN)
		{
			if (d_sig === D_FOOD && view[4].color === D_MARCH) return sigc(U_REALIGN, CCW[c][4]); 
			if ([D_FOOD, D_GATHERER].includes(view[4].color)) return sigc(D_STALLED, CCW[c][4]);
		}
		if (u_sig === U_SENTINEL)
		{
			if (d_sig === D_FOOD)
			{
				if (view[4].color === U_REALIGN) return sigc(D_STALLED, CCW[c][4]);
				if (view[4].color === D_MARCH) return sigc(U_REALIGN, CCW[c][4]);
			}
			if (d_sig === D_GATHERER && view[4].color === U_REALIGN) return sigc2(D_STALLED, CCW[c][4]);
			if (d_sig === D_MARCH && view[4].color === U_SENTINEL) return sigc(D_MARCH, CCW[c][4]); 
			if (d_sig === D_STALLED && view[4].color === U_SENTINEL) return sigc(D_STALLED, CCW[c][4]); 
			if (d_sig === U_READY && view[4].color === D_STALLED) return sigc(U_READY, CCW[c][4]); 
			if ([D_FOOD, D_GATHERER].includes(view[4].color)) return sigc(D_STALLED, CCW[c][4]);
		}
		if (u_sig === U_READY)
		{
			if (d_sig === D_FOOD && view[4].color === D_MARCH) return sigc(U_REALIGN, CCW[c][4]); 
			if ([D_FOOD, D_GATHERER].includes(view[4].color)) return sigc(D_MARCH, CCW[c][4]);
		}
		return sigc(view[4].color, CCW[c][4]); 
	}
}

function mdec_three_recover(c)
{
	//This should only happen in the middle of recovery
	return sigc(U_SENTINEL, c); 
}

function mdec_three_hang(c)
{
	return sigc2(view[4].color, CCW[c][4]); 
}

function mdec_three_unhang(c)
{
	return sigc2(view[4].color, c); 
}

function mdec_four_z(c)
{
	//Under certain conditions, this can appear during recovery
	//But this is usually a normal-march thing, so check both sides for indicators
	var provisional = lchk2(CCW[c][4]);
	if (provisional !== null) return sigc2(provisional, CCW[c][4]); 

	var u_sig = PSIDES[view[c].color][view[CCW[c][7]].color];
	var d_sig = PSIDES[view[CCW[c][4]].color][view[CCW[c][3]].color];

	if (u_sig === D_FOOD)
	{
		if ([D_FOOD, D_STALLED, U_REALIGN].includes(d_sig) && view[4].color === U_REALIGN) return sigc2(U_REALIGN, CCW[c][4]);
		if (d_sig === D_GATHERER && [U_REALIGN, D_GATHERER].includes(view[4].color)) return sigc2(U_REALIGN, CCW[c][4]);
	}
	if (u_sig === D_STALLED)
	{
		if (d_sig === U_REALIGN) return sigc2(U_REALIGN, CCW[c][4]); 
		if (d_sig === D_FOOD && view[4].color === U_REALIGN) return sigc2(U_REALIGN, CCW[c][4]);
	}
	if (u_sig === D_GATHERER)
	{
		if (d_sig === U_REALIGN && view[4].color === U_REALIGN) return sigc2(D_STALLED, CCW[c][4]); 
		if (d_sig === D_FOOD && [U_REALIGN, D_GATHERER].includes(view[4].color)) return sigc2(U_REALIGN, CCW[c][4]);
	}
	if (u_sig === U_REALIGN)
	{
		if (d_sig === D_FOOD && view[4].color === U_REALIGN) return sigc2(U_REALIGN, CCW[c][4]); 
		if (d_sig === D_STALLED) return sigc2(U_REALIGN, CCW[c][4]); 
		if (d_sig === D_GATHERER && view[4].color === U_REALIGN) return sigc2(D_STALLED, CCW[c][4]); 
		if (d_sig === U_READY && view[4].color === U_REALIGN) return sigc2(D_MARCH, CCW[c][4]); 
	}
	if (u_sig === U_READY && d_sig === U_REALIGN && view[4].color === U_REALIGN)
		return sigc2(D_MARCH, CCW[c][4]); 

	return sigc2(D_MARCH, CCW[c][4]); 
}

function mdec_four_stairs(c)
{
	var provisional = lchk2(c);
	if (provisional !== null) return sigc2(provisional, c);

	var u_sig = PSIDES[view[c].color][view[CCW[c][1]].color];
	var d_sig = PSIDES[view[CCW[c][4]].color][view[CCW[c][3]].color];

	if (u_sig === D_MARCH)
	{
		if (d_sig === D_FOOD)
		{
			if (view[4].color === D_MARCH) return sigc2(D_FOOD, c);
			if (view[4].color === U_REALIGN) return sigc2(D_MARCH, c);
		}
		if (d_sig === U_READY)
		{
			if (view[4].color === U_READY) return sigc2(D_MARCH, c);
			if (view[4].color === U_REALIGN) return sigc2(D_MARCH, c);
		}
		if (d_sig === D_STALLED)
		{
			if (view[4].color === D_MARCH) return sigc2(D_STALLED, c);
			if (view[4].color === U_REALIGN) return sigc2(D_STALLED, c);
		}
		if (d_sig === D_GATHERER && view[4].color === U_REALIGN)
			return sigc2(D_STALLED, c);
		if ([D_MARCH, U_REALIGN].includes(d_sig) && view[4].color === U_REALIGN)
			return sigc2(D_MARCH, c);
	}

	if (u_sig === D_FOOD)
	{
		if (d_sig === D_MARCH)
		{
			if (view[4].color === U_REALIGN) return sigc2(D_MARCH, c);
			if (view[4].color === D_MARCH) return sigc2(D_FOOD, c);
		}
		if (d_sig === U_READY)
		{
			if (view[4].color === U_REALIGN) return sigc2(D_MARCH, c);
			if (view[4].color === D_STALLED) return sigc2(D_STALLED, c);
		}
		if (d_sig === D_GATHERER && [U_REALIGN, D_GATHERER].includes(view[4].color))
			return sigc2(D_FOOD, c);
		if ([U_REALIGN, D_STALLED].includes(d_sig) && view[4].color === U_REALIGN)
			return sigc2(D_STALLED, c);
	}

	if (u_sig === D_STALLED)
	{
		if (d_sig === D_STALLED)
		{
			if (view[4].color === D_STALLED) return sigc2(D_STALLED, c);
			if (view[4].color === D_MARCH) return sigc2(D_STALLED, c);
			if (view[4].color === U_REALIGN) return sigc2(D_MARCH, c);
		}
		if (d_sig === D_MARCH)
		{
			if (view[4].color === D_MARCH) return sigc2(D_STALLED, c);
			if (view[4].color === U_REALIGN) return sigc2(D_STALLED, c);
		}
		if (d_sig === D_GATHERER)
		{
			if (view[4].color === U_REALIGN) return sigc2(D_MARCH, c);
			if ([D_STALLED, D_GATHERER].includes(view[4].color)) return sigc2(D_STALLED, c);
		}
		if (d_sig === U_READY)
		{
			if (view[4].color === D_STALLED) return sigc2(U_READY, c);
			if (view[4].color === U_REALIGN) return sigc2(D_MARCH, c);
		}
		if (d_sig === U_REALIGN && [U_REALIGN, D_MARCH].includes(view[4].color))
			return sigc2(D_STALLED, c);
		if (d_sig === D_FOOD && view[4].color === U_REALIGN)
			return sigc2(D_STALLED, c);
	}

	if (u_sig === D_GATHERER)
	{
		if (d_sig === D_STALLED)
		{
			if ([D_STALLED, D_GATHERER].includes(view[4].color)) return sigc2(D_STALLED, c);
			if (view[4].color === U_REALIGN) return sigc2(D_STALLED, c);
		}
		if (d_sig === U_READY)
		{
			if (view[4].color === D_STALLED) return sigc2(D_STALLED, c);
			if (view[4].color === U_REALIGN) return sigc2(D_STALLED, c);
		}
		if (d_sig === D_FOOD && [D_GATHERER, U_REALIGN].includes(view[4].color))
			return sigc2(D_FOOD, c);
		if ([D_MARCH, U_REALIGN].includes(d_sig) && view[4].color === U_REALIGN)
			return sigc2(D_STALLED, c);
		if (d_sig === D_GATHERER && view[4].color === U_REALIGN)
			return sigc2(D_STALLED, c);
	}

	if (u_sig === U_REALIGN)
	{
		if (d_sig === U_REALIGN)
		{
			if (view[4].color === D_MARCH) return sigc2(D_STALLED, c);
			if (view[4].color === U_REALIGN) return sigc2(D_STALLED, c);
		}
		if (d_sig === D_STALLED)
		{
			if (view[4].color === D_MARCH) return sigc2(D_STALLED, c);
			if (view[4].color === U_REALIGN) return sigc2(D_STALLED, c);
		}
		if (d_sig === D_MARCH && view[4].color === U_REALIGN)
			return sigc2(D_MARCH, c);
		if ([D_FOOD, D_GATHERER, U_READY].includes(d_sig) && view[4].color === U_REALIGN)
			return sigc2(D_STALLED, c);
	}

	if (u_sig === U_READY)
	{
		if (d_sig === D_MARCH)
		{
			if (view[4].color === U_READY) return sigc2(D_MARCH, c);
			if (view[4].color === U_REALIGN) return sigc2(U_READY, c);
		}
		if ([D_FOOD, D_GATHERER].includes(d_sig))
		{
			if (view[4].color === D_STALLED) return sigc2(D_STALLED, c);
			if (view[4].color === U_REALIGN) return sigc2(U_READY, c);
		}
		if (d_sig === D_STALLED && view[4].color === D_STALLED)
			return sigc2(U_READY, c);
		if (d_sig === U_REALIGN && view[4].color === U_REALIGN)
			return sigc2(D_STALLED, c);
		if (d_sig === U_READY && view[4].color === U_REALIGN)
			return sigc2(U_READY, c);
	}

	return sigc2(view[4].color, c);
	
}

//Don't step on food or enemies. Instead, signal. 
function mwatch(candidate)
{
	if (candidate.cell === 4) return candidate;
	if (candidate.hasOwnProperty("color")) return candidate;
	if (view[candidate.cell].food !== 0) return sigc2(D_FOOD, 0);
	if (is_harvestable(candidate.cell)) return sigc2(D_FOOD, 0);
	if (view[candidate.cell].ant !== null) return sigc2(U_PANIC, 0);
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
	var c = view_corner();
	if (view[4].color === U_PANIC || this_ant().food > 0) return sanitize(saboteur(), FREE_ORDER);
	switch (neighbor_type(c))
	{
		case ONE_CORNER: return mwatch(mdec_one_corner(c));
		case ONE_EDGE: return mwatch(mdec_one_edge(c));
		case EE_BENT: return mwatch(mdec_ee_bent(c));
		case EE_STRAIGHT: return mwatch(mdec_ee_straight(c));
		case EC_LEFT: return mwatch(mdec_ec_left(c));
		case EC_RIGHT: return mwatch(mdec_ec_right(c));
		case EC_SPAWN: return mwatch(mdec_ec_spawn(c));
		case THREE_MARCH: return mwatch(mdec_three_march(c));
		case THREE_STAND: return mwatch(mdec_three_stand(c));
		case THREE_RECOVER: return mwatch(mdec_three_recover(c));
		case THREE_UNSTAND: return mwatch(mdec_three_unstand(c));
		case THREE_HANG: return mwatch(mdec_three_hang(c));
		case THREE_UNHANG: return mwatch(mdec_three_unhang(c));
		case FOUR_Z: return mwatch(mdec_four_z(c));
		case FOUR_STAIRS: return mwatch(mdec_four_stairs(c));
		default: return sanitize(saboteur(), FREE_ORDER);
	}
	
}

