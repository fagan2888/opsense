package edu.nyu.vgc.opsense.elasticsearch;


import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
@SuppressWarnings("serial")
public class MyWorldFixer extends Fixer {

	
	Map<Object, Object> countries = new HashMap(){{
		put(6   , "Antigua and Barbuda");
		put(9   , "Australia");
		put(12  , "Bahamas");
		put(15  , "Barbados");
		put(18  , "Belize");
		put(31  , "Canada");
		put(50  , "Dominica");
		put(66  , "Ghana");
		put(68  , "Grenada");
		put(72  , "Guyana");
		put(77  , "India");
		put(81  , "Ireland");
		put(84  , "Jamaica");
		put(88  , "Kenya");
		put(95  , "Lesotho");
		put(118 , "Namibia");
		put(122 , "New Zealand");
		put(125 , "Nigeria");
		put(143 , "Saint Kitts and Nevis");
		put(145 , "Saint Vincent and the Grenadines");
		put(154 , "Singapore");
		put(175 , "Trinidad and Tobago");
		put(180 , "Uganda");
		put(183 , "United Kingdom of Great Britain and Northern Ireland");
		put(185 , "United States of America");
		put(193 , "Zimbabwe");
	}};
	
	Map<Object, Object> education = new HashMap(){{
		put("1","Some primary");
		put("2","Finished primary");
		put("3","Some secondary");
		put("4","Finished secondary");
	}};
	
	Map<Object, Object> priority = new HashMap(){{
		put("100","Action taken on climate change");
		put("101","Better transport and roads");
		put("102","Support for people who can't work");
		put("103","Access to clean water and sanitation");
		put("104","Better healthcare");
		put("105","A good education");
		put("106","A responsive government we can trust");
		put("107","Phone and internet access");
		put("108","Reliable energy at home");
		put("109","Affordable and nutritious food");
		put("110","Protecting forests, rivers and oceans");
		put("112","Political freedoms");
		put("111","Protection against crime and violence");
		put("113","Freedom from discrimination and persecution");
		put("114","Equality between men and women");
		put("115","Better job opportunities");
	}};
	Map<Object, Object> gender = new HashMap(){{
		put("1","Male");
		put("2","Female");
	}};
	
		
	@Override
	public JsonObject fix(JsonObject object) {
		if(!isValid(object))
			return null;
		
		//Fix values
		replace(object,"country",countries);
		replace(object,"education",education);
		replace(object,"gender",gender);
		replace(object,"priority1",priority);
		replace(object,"priority2",priority);
		replace(object,"priority3",priority);
		replace(object,"priority4",priority);
		replace(object,"priority5",priority);
		replace(object,"priority6",priority);
		
		JsonObject result = new JsonObject();
		JsonObject entity = new JsonObject();
		JsonObject document = new JsonObject();
		JsonObject author = new JsonObject();
		
		entity.addProperty("id", currentLine);
		entity.addProperty("name", object.get("source").getAsString());
		entity.addProperty("partner_code", object.get("partner_code").getAsString());
		
		
		author.addProperty("id", currentLine);
		author.addProperty("gender",  object.get("gender").getAsString());
		author.addProperty("age",  object.get("age").getAsInt());
		author.addProperty("education",  object.get("education").getAsString());
		author.addProperty("country",  object.get("country").getAsString());
		
		
		document.addProperty("id", currentLine);
		document.addProperty("date", object.get("date").getAsString().substring(0, 10));
		
		JsonArray priorities = new JsonArray();
		for(int i=1; i<=6; i++){
			if(object.get("priority" +i).getAsString().length() > 0)
				priorities.add(object.get("priority" +i));
		}
		document.add("priorities", priorities);
		
		document.addProperty("text", object.get("vote_reason").getAsString());
		
		
		
		result.add("entity", entity);
		result.add("author", author);
		result.add("document", document);
		
		return result;
	}

	@Override
	public String getId(JsonObject object) {
		return "1";
	}
	
	public boolean isValid(JsonObject object){
		if(object.get("vote_reason").getAsString().length() ==  0)
			return false;
		
		if(!countries.keySet().contains(object.get("country").getAsInt()))
			return false;

		return true;
		
	}
}
