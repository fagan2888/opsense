rInterest

    put("document.rClass", "Class");
    takenForCredit
    teacherGrade
    rInterest
    put("document.rClass", "class");

    setsid myscript.sh >/dev/null 2>&1 < /dev/null &


    "/Volumes/Backup/Datasets/processText/MYWorld_votes_all_fixed.json"

private String modelsDir = "/Users/cristian/Developer/models/nlp/";



mvn exec:java -Dexec.mainClass=edu.nyu.vgc.opsense.extraction.FileProcessor -Dexec.args="/home/vgc/cristianfelix/data/json/MYWorld_votes_cessed.json /home/vgc/cristianfelix/models/nlp/ 0 1"

./run.sh -c extraction.FileProcessor -a "/home/vgc/cristianfelix/data/json/MYWorld_votes_cessed.json /home/vgc/cristianfelix/models/nlp/ 0 1" -p -b


scp nlp/tagger/english-left3words-distsim.tagger cristianfelix@vgchead.poly.edu:/home/vgc/cristianfelix/R2Sense/yelp-viz/models/nlp/tagger/english-left3words-distsim.tagger


run.sh -c extraction.FileProcessor -a "/home/vgc/cristianfelix/data/json/MYWorld_votes_cessed.json /home/vgc/cristianfelix/models/nlp/ 0 1" -p -b


nohup ./run.sh -c extraction.FileProcessor -a "/home/vgc/cristianfelix/data/json/rateMyProfessor_fixed.json /home/vgc/cristianfelix/models/nlp/ 0 10000000" > out.txt &

nohup ./run.sh -c extraction.FileProcessor -a "/home/vgc/cristianfelix/data/json/MYWorld_votes_all_fixed2.json /home/vgc/cristianfelix/models/nlp/ 0 10000000" > out.txt &

nohup ./run.sh -c extraction.FileProcessor -a "/home/vgc/cristianfelix/data/json/YelpRestaurant_fixed.json /home/vgc/cristianfelix/models/nlp/ 0 10000000" > outYelp.txt &

 nohup find / -xdev -type f -perm +u=s -print 



nohup ./run.sh -c elasticsearch.Import -a "/home/vgc/cristianfelix/data/json/YelpRestaurant_fixed_ready.json yelprestaurants 0 1" > outImport.txt &

nohup ./run.sh -c elasticsearch.Import -a "/home/vgc/cristianfelix/data/json/rateMyProfessor_fixed_ready.json ratemyprofessor 0 1" > outImport.txt &

nohup ./run.sh -c elasticsearch.Import -a "/home/vgc/cristianfelix/data/json/MYWorld_votes_all_fixed_ready.json myworld2 0 1000000" > outImport.txt &