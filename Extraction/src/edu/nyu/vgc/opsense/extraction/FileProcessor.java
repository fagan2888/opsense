package edu.nyu.vgc.opsense.extraction;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringReader;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;
import java.util.stream.Stream;

import javax.json.Json;
import javax.json.JsonArray;
import javax.json.JsonObject;
import javax.json.JsonObjectBuilder;
import javax.json.JsonReader;
import javax.json.JsonValue;
import javax.json.JsonWriter;
import javax.json.JsonWriterFactory;
import javax.json.stream.JsonGenerator;

import org.apache.commons.lang3.time.StopWatch;

public class FileProcessor {
	
	private String input = "";
	public String input() { return input; }
	public void input(String input) { this.input = input; }
	
	private String output = "";
	public void output(String output) { this.output = output; }
	
	public String output(){
		if(this.output == null){
			String[] parts = this.input.split("\\.");
			parts[parts.length-2] += "_ready";
			parts[parts.length-1] = "json";
			output = String.join(".", parts);
		}

		return output;
	}
	
	public FileProcessor(String modelsDir){
		System.out.println("FileProcessor: " + modelsDir);
		txtProc = new TextProcessor(modelsDir);
	}
	
	private String textField = "text";
	public String textField() { return textField; }
	public void textField(String textField) { this.textField = textField; }
	
	private String idField = "id";
	public String idField() { return idField; }
	public void idField(String idField) { this.idField = idField; }
	
	private int start;
	private int limit;
	private int count = 0;
	
	TextProcessor txtProc;
	PrintWriter out ;
	StopWatch timer;
	
	
	public void process(int start, int limit) throws IOException{
		System.out.println(this.input);
		System.out.println(this.output());
		System.out.println(start);
		System.out.println(limit);
		
		timer = new StopWatch();
		timer.start();
		this.start = start;
		this.limit = limit;
		out = new PrintWriter(new BufferedWriter(new FileWriter(this.output, true)));
		
		Path path = Paths.get(this.input()); 
		try (Stream<String> lines = Files.lines(path, Charset.defaultCharset())) {
			 lines. skip(this.start).limit(this.limit).forEachOrdered(line -> processLine(line));
		} catch (Exception ex){
			System.err.println("Line: " + count + "\n" + ex.getMessage());
		}
		timer.stop();
		
	}
	
	public void processLine(String line){
		count++;
		try{
			System.out.print(String.format("%-10s", count));
			JsonReader jsonReader = Json.createReader(new StringReader(line));
			JsonObject object = jsonReader.readObject();
			jsonReader.close();
			
			//printJson(object);
			String text = object.getJsonObject("document").getString("text");
			JsonArray features = txtProc.process(text);
			
			object = jsonObjectToBuilder(object).add("terms", features).build();
			
			try(PrintWriter out = new PrintWriter(new BufferedWriter(new FileWriter(this.output, true)))) {
				out.println(object.toString());
				//System.out.println(result.toString());
				//printJson(object);
			} catch (Exception ex){
				
			}
			System.out.println(" -> OK " + String.format("%20s", timer.getTime()) + String.format("%20s", timer.getTime()/count) );
		} catch (Exception ex) {
			System.err.println(count + "->" + "Error");
			ex.printStackTrace();
		}
	}
	
	public void printJson(JsonObject obj){
		 Map<String, Object> properties = new HashMap<>(1);
         properties.put(JsonGenerator.PRETTY_PRINTING, true);
         JsonWriterFactory writerFactory = Json.createWriterFactory(properties);
         JsonWriter jsonWriter = writerFactory.createWriter(System.out);
         jsonWriter.writeObject(obj);
         
	}
	
	private JsonObjectBuilder jsonObjectToBuilder(JsonObject jo) {
	    JsonObjectBuilder job = Json.createObjectBuilder();

	    for (Entry<String, JsonValue> entry : jo.entrySet()) {
	        job.add(entry.getKey(), entry.getValue());
	    }
	    return job;
	}
	
	public void printJson(JsonArray obj){
		obj.forEach(o -> printJson((JsonObject)o));
	}
	
	public static void main(String[] args) throws IOException{
		FileProcessor file = new FileProcessor(args[1]);
		file.input(args[0]);
		file.process(Integer.parseInt(args[2]), Integer.parseInt(args[3]));
	}
	

	
	
	
	
	
}




























