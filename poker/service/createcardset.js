var _ = require("underscore");
var Card = require("./card");
var returntype = [];

   function getSetType(carddds) {
    
	returntype = [];
	  var cardSet = _.sortBy(carddds, "priority").reverse();
	  
	returntype[0] = 10;
	returntype[1]  = "high card";
	returntype[2]  = cardSet;
	returntype[3]  = cardSet[0].priority;
	returntype[5]  = cardSet[1].priority;
	returntype[6]  = cardSet[2].priority;
	returntype[7]  = cardSet[3].priority;
	returntype[8]  = cardSet[4].priority;
	returntype[9]  = cardSet[4].priority;
	 let typee = isRoyalFlash(cardSet);
	  
	 
	   
	   if(typee == "royal flash")
	   { 	returntype[0] = 1;
			returntype[1] = typee;
			
		    return returntype; 
	   }else if(typee == "straight flash")
	   {
			returntype[0] = 2;
			returntype[1] = typee;
			
		    return returntype; 
	   }else if(typee == "same color" || typee == "high card" )
	   {
		   
		  typee = FourOfKind(cardSet); 
		  
		  if(typee == "four of kind")
		  { 
			returntype[0] = 3;
			returntype[1] = typee;
		    return returntype; 
		  }else if(typee == "full house")
		  {
			  returntype[0] = 4;
			returntype[1] = typee;
		    return returntype; 
		  }else
		  {
			  let typeflush = isFlashCard(cardSet); 
			  
			  if(typeflush == "fluse")
				{
					returntype[0] = 5;
					returntype[1] = typeflush;
					return returntype; 
				}else 
				{
					let type3 = isStraight(cardSet);
					if(type3 == "straight")
					{
						returntype[0] = 6;
						returntype[1] = type3;
						return returntype; 
					}else if(typee == "three of kind")
					{
						returntype[0] = 7;
						returntype[1] = typee;
						return returntype; 
						
						
					}else if(typee == "two pairs")
					{
						returntype[0] = 8;
						returntype[1] = typee;
						return returntype;
					}else if(typee == "one pair")
					{
						returntype[0] = 9;
						returntype[1] = typee;
						return returntype;
					}else
					{
						returntype[0] = 10;
						returntype[1] = typee;
						return returntype;
					}
				}
		  }
		  
	   }
	  
		
		
      return typee;
    };
   
   
  
  function FourOfKind(cardset) {
		
		let same =1;
		let samecard = [];
		
		if(cardset[0].priority ==cardset[1].priority )
		{
			same = 2;
			returntype[4]  = cardset[0].priority;
			samecard.push(cardset[0]);
			samecard.push(cardset[1]);
			
			if(cardset[1].priority == cardset[2].priority )
			{
				same = 3;
				returntype[4]  = cardset[3].priority;
				samecard.push(cardset[2]);
				if(cardset[2].priority ==cardset[3].priority  )
				{
					same =4;
					returntype[4]  = cardset[2].priority;
					samecard.push(cardset[4]);
					if(cardset[3].priority  ==cardset[4].priority )
					{
						same =5;
						returntype[4]  = cardset[3].priority;
						samecard.push(cardset[5]);
					}
				}
				
				
				
				
			}
		}else 
		if(cardset[1].priority ==cardset[2].priority )
		{
			same = 2;
			returntype[4]  = cardset[1].priority;
			samecard.push(cardset[1]);
			samecard.push(cardset[2]);
			if(cardset[2].priority == cardset[3].priority )
			{
				same = 3;
				returntype[4]  = cardset[1].priority;
				samecard.push(cardset[3]);
				if(cardset[3].priority == cardset[4].priority )
				{
					same =4;
					returntype[4]  = cardset[3].priority;
					samecard.push(cardset[4]);
				}
			}
		}else if(cardset[2].priority ==cardset[3].priority )
		{
			same = 2;
			returntype[4]  = cardset[2].priority;
			samecard.push(cardset[2]);
			samecard.push(cardset[3]);
			if(cardset[3].priority == cardset[4].priority )
			{
				same = 3;
					returntype[4]  = cardset[3].priority;
				samecard.push(cardset[4]);
			}
		}else if(cardset[3].priority ==cardset[4].priority )
		{		
			same = 2;
			returntype[4]  = cardset[3].priority;
			samecard.push(cardset[3]);
			samecard.push(cardset[4]);
		}else
		{
			same = 1;
		}
		
		if(same ==4)
		{
			return "four of kind";
		}if(same == 3)
		{
			let sameothercard = [];
			let issame = 0;
			
			for(let  jj =0;jj <5; jj++)
			{
				issame = 0;
				for(let kk =0 ; kk <3;kk++)
				{
					if(samecard[kk].priority == cardset[jj].priority && samecard[kk].type == cardset[jj].type)
					{
						issame = 1;
					}
				}
				
				if(issame == 0)
				{
					sameothercard.push(cardset[jj]);
				}
				
			}
			
			
			if(sameothercard[0].priority ==sameothercard[1].priority )
			{
				return "full house";
			}else
			{
				return "three of kind";
			}
			
		}else if(same == 2)
		{
			let sameothercard = [];
			let issame = 0;
			
			for(let  jj =0;jj <5; jj++)
			{
				issame = 0;
				for(let kk =0 ; kk <2;kk++)
				{
					
					if(samecard[kk].priority == cardset[jj].priority && samecard[kk].priority == cardset[jj].priority)
					{
						issame = 1;
					}
				}
				
				if(issame == 0)
				{
					sameothercard.push(cardset[jj]);
				}
				
			}
			
			if(sameothercard[0].priority == sameothercard[1].priority)
			{
				if(sameothercard[0].priority == sameothercard[1].priority && sameothercard[1].priority  == sameothercard[2].priority)
				{
						return "full house";
				}
			}else if(sameothercard[1].priority == sameothercard[2].priority)
			{
				returntype[9]  = sameothercard[1].priority ;
				return "two pairs";
			}else
			{
				return "one pair";
			}
			
		}else
		{
			return "all diff";
		}
			
	
		
		
		
		
		return same;
	}
  
  
  
  
    function isRoyalFlash(cardset) {
		 
		 
		
		 
		let type  = "high card";
		if(cardset[0].type == cardset[1].type == cardset[2].type == cardset[3].type == cardset[4].type)
		{
			type = "same color";
			
			if(cardset[0].priority +2   == cardset[1].priority +1 == cardset[2].priority == cardset[3].priority -1 == cardset[4].priority -2)
			{
				
				if(cardset[4].priority == 14)
				{
					type = "royal flash";
				}else
				{
					type = "straight flash";
				}
			}
			
			
		}
			
		return type;
	}
  
  
   function isStraight(cardset) {
		 
		let type  = "high card";
		
	
		if(
			(cardset[0].priority == cardset[1].priority +1 ) && 
			(cardset[1].priority  == cardset[2].priority+1 ) &&  
			(cardset[2].priority  == cardset[3].priority +1 ) &&
			(cardset[3].priority == cardset[4].priority +1 ) 
		)
			{
					type = "straight";
				
			}
			
			
		
		return type;
	}
  
  
  
  
  
  
    function isFlashCard(cardset) {
		 
		let type  = "all diff";
		if(cardset[0].type == cardset[1].type == cardset[2].type == cardset[3].type == cardset[4].type)
		{
			type = "all color";
			
			if(cardset[0].priority +4   == cardset[1].priority +2 == cardset[2].priority == cardset[3].priority -2 == cardset[4].priority -4)
			{
				type = "fluse";
				
				
			}
			
			
		}
			
		return type;
	}
  
  
  


module.exports = {
    getSetType,
	
}