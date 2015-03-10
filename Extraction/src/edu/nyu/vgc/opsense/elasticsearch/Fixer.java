package edu.nyu.vgc.opsense.elasticsearch;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Map;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

public abstract class Fixer {
	public abstract JsonObject fix(JsonObject object);
	public abstract String getId(JsonObject object);
	
	public JsonObject getBuilder(JsonObject jo){
	   
	    return jo;
	}
	
	public JsonObject rename(JsonObject jo, Map<String, String> map){
		map.forEach((k,v) ->{
			JsonObject obj = getParent(jo, k);
			String[] fs = k.split("\\.");
			JsonElement value = obj.remove(fs[fs.length-1]);
			obj.add(v, value);
		});
		return jo;
		
	}
	
	public JsonObject add(JsonObject jo, Map<String, Object> map){
		map.forEach((k,v) ->{
			JsonObject obj = getParent(jo, k);
			String[] fs = k.split("\\.");
			add(obj, fs[fs.length-1], v);
		});
		return jo;
	}
	
	public JsonObject add(JsonObject jo, String name, Object value){
		if (value instanceof Number) {
			jo.addProperty(name, (Number)value);
		} else if (value instanceof Character) {
			jo.addProperty(name, (Character)value);
		} else if (value instanceof Boolean) {
			jo.addProperty(name, (Boolean)value);
		} else {
			jo.addProperty(name, value.toString());
		} 
		return jo;
	}
	
	public JsonObject remove(JsonObject jo, Map<String, String> map){
		map.forEach((k,v) ->{
			remove(jo,k);
		});
		return jo;	
	}
	
	public String fixDate(String dateOriginal, String format){
		SimpleDateFormat dt = new SimpleDateFormat(format); 		
		try {
			Date date;
			date = dt.parse(dateOriginal);
			SimpleDateFormat dt1 = new SimpleDateFormat("yyyyy-mm-dd");
			return (dt1.format(date));
		} catch (ParseException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} 
		return dateOriginal;
		
	}
	
	public JsonObject get(JsonObject jo, String k){
		String[] fs = k.split("\\.");
		JsonObject obj2 = jo;
		for(int i =0; i < fs.length; i++){
			obj2 = obj2.getAsJsonObject(fs[i]);
		}
		return obj2;
	}
	
	public JsonObject getParent(JsonObject jo, String k){
		String[] fs = k.split("\\.");
		JsonObject obj2 = jo;
		for(int i=0; i < fs.length-1; i++){
			obj2 = obj2.getAsJsonObject(fs[i]);
		}
		return obj2;
	}
	
	public JsonObject remove(JsonObject jo, String k){
		String[] fs = k.split("\\.");
		JsonObject obj2 = jo;
		for(int i =0; i < fs.length-1; i++){
			obj2 = obj2.getAsJsonObject(fs[i]);
		}
		obj2.remove(fs[fs.length-1]).getAsJsonObject();
		return obj2;
	}
	
}
