package edu.nyu.vgc.opsense.elasticsearch;

import java.util.HashMap;

import com.google.gson.JsonObject;

public class ZocDocFixer extends Fixer {

	@SuppressWarnings("serial")
	@Override
	public JsonObject fix(JsonObject object) {
		
		//Rename
		HashMap<String,String> rename = new HashMap<String,String>() {{
			put("entity.LongProfessionalName", "name");
			put("document.Text", "text");
			put("author.Name", "name");
		}};
		rename(object, rename);
		HashMap<String,Object> add = new HashMap<String,Object>() {{
			put("author.docCount", -1);
		}};
		add(object, add);
		
		return object;
	}

	@Override
	public String getId(JsonObject object) {
		// TODO Auto-generated method stub
		return "1";
	}

}

