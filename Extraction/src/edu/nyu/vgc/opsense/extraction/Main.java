package edu.nyu.vgc.opsense.extraction;

import org.apache.commons.lang3.time.StopWatch;

public class Main {
	public static void main(String[] args) {
		String tests[] = {"She is beautiful", "The good food"};
		Parser p = new Parser();
		GraphBuilder g = new GraphBuilder();
		StopWatch st = new StopWatch();
		st.start();
		for(String test: tests){
			p.parse(test);
		}
		st.stop();
		System.out.println("Done");
		System.out.println(st.getTime());
	}
}
