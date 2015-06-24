from random import random
def samplename():
	return str(random())+str(random())+str(random())+str(random());

f = open("fakedata.txt","w")
for i in xrange(4000):
	f.write("{\n")
	f.write('"attr_id":"GENDER",\n')
	f.write('"attr_val":"%s",\n'%("MALE" if random() < 0.5 else "FEMALE"))
	f.write('"sample":"%s"\n'%samplename())
	f.write("},\n")
f.close()
	
	
