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
	
	public int currentLine;
	
	
	public static String unquote(String s) {

		 if (s != null
		   && ((s.startsWith("\"") && s.endsWith("\""))
		   || (s.startsWith("'") && s.endsWith("'")))) {

		  s = s.substring(1, s.length() - 1);
		 }
		 return s;
		}
	
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
	//This do not make sense
	public JsonObject replace(JsonObject obj, String field, Map<Object, Object> map){
		Object currValue=null;
		for(Object j: map.keySet()){
			currValue = j;
			break;
		}
		Object res = getEqualType(obj, currValue, field);
		add(obj, field, map.get(res));
		return obj;
	}
	
	public JsonObject replace(JsonObject obj, String field, JsonObject map){
		Object currValue=null;
		for(Map.Entry<String, JsonElement> j: map.entrySet()){
			currValue = j.getKey();
			break;
		}
		Object res = getEqualType(obj, currValue, field);
		add(obj, field, map.get(res.toString()));
		return obj;
	}
	
	
	public Object getEqualType(JsonObject obj, Object value, String field){
		if (value instanceof String) {
			return obj.get(field).getAsString();
		} 
		else if (value instanceof Boolean) {
			return obj.get(field).getAsBoolean();
		} 
		else if (value instanceof Double) {
			return obj.get(field).getAsDouble();
		} 
		else if (value instanceof Float) {
			return obj.get(field).getAsFloat();
		}
		else if (value instanceof Integer) {
			return obj.get(field).getAsInt();
		}
		else if (value instanceof Long) {
			return obj.get(field).getAsLong();
		}
		else if (value instanceof Short) {
			return obj.get(field).getAsShort();
		}
		
		if (value instanceof Number) {
			return obj.get(field).getAsNumber();
		}

		if (value instanceof Character) {
			return obj.get(field).getAsCharacter();
		}
		else {
			return obj.get(field).toString();
		} 
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
			if(value == null){
				jo.addProperty(name,new String());
			}
			else
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
