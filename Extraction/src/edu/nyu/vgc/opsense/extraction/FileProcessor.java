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
import java.util.stream.Stream;

import javax.json.Json;
import javax.json.JsonArray;
import javax.json.JsonObject;
import javax.json.JsonReader;
import javax.json.JsonWriter;
import javax.json.JsonWriterFactory;
import javax.json.stream.JsonGenerator;

import org.apache.commons.lang3.time.StopWatch;

public class FileProcessor {
	
	private String input = "";
	public String input() { return input; }
	public void input(String input) { this.input = input; }
	
	private String output = "";
	public String output() { return output; }
	public void output(String output) { this.output = output; }
	
	private String textField = "text";
	public String textField() { return textField; }
	public void textField(String textField) { this.textField = textField; }
	
	private String idField = "review_id";
	public String idField() { return idField; }
	public void idField(String idField) { this.idField = idField; }
	
	private int start;
	private int limit;
	private int count = 0;
	
	TextProcessor txtProc = new TextProcessor();
	PrintWriter out ;
	StopWatch timer;
	
	
	public void process(int start, int limit) throws IOException{
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
			String text = object.getString("rComments");
			JsonArray features = txtProc.process(text);
			int rating = object.getInt("rClarity") + object.getInt("rEasy") + object.getInt("rHelpful");
			rating = Math.round(rating/3);
			JsonObject result = Json.createObjectBuilder()
					.add("id", object.get("_id"))
					.add("rating", rating)
					.add("entity_id", object.get("tid"))
					.add("rank", 1)
					.add("date", object.get("rDate"))
					.add("text", object.get("rComments"))
					.add("terms", features).build();
				
			try(PrintWriter out = new PrintWriter(new BufferedWriter(new FileWriter(this.output, true)))) {
				
				out.println(result.toString());
				//System.out.println(result.toString());
				//printJson(result);
			} catch (Exception ex){
				
			}
			System.out.println(" -> OK " + String.format("%20s", timer.getTime()) + String.format("%20s", timer.getTime()/count) );
		} catch (Exception ex) {
			System.err.println(count + "->" + "Error");
			System.err.println(ex.getMessage());
		}
	}
	
	public void printJson(JsonObject obj){
		 Map<String, Object> properties = new HashMap<>(1);
         properties.put(JsonGenerator.PRETTY_PRINTING, true);
         JsonWriterFactory writerFactory = Json.createWriterFactory(properties);
         JsonWriter jsonWriter = writerFactory.createWriter(System.out);
         jsonWriter.writeObject(obj);
         
	}
	
	public void printJson(JsonArray obj){
		obj.forEach(o -> printJson((JsonObject)o));
	}
	
	public static void main(String[] args) throws IOException{
		FileProcessor file = new FileProcessor();
		file.input("/Users/cristian/Downloads/rateprof.json");
		file.output("/Users/cristian/Downloads/rateprof_processed.json");
		file.process(500000, 1500000);
	}
	
	
	
}




























