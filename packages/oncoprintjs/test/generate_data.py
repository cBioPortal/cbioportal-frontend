import json
import numpy as np
import pandas as pd


def generate_heatmap_data():
	hm_df = pd.DataFrame(
		columns=['TCGA-{0:02d}'.format(n) for n in range(50)],
		index=['GENE{0}'.format(n) for n in range(5)])
	
	hm_df.ix[:, :] = np.random.randn(*hm_df.values.shape)
	hm_df.ix[:3, :12] = np.random.randn(3, 12) + 1
	hm_df.ix[3:, :12] = np.random.randn(2, 12) - 0.5
	hm_df.ix[:2, 12:28] = np.random.randn(2, 28-12) - 2
	hm_df.ix[2:, 28:35] = np.random.randn(3, 35-28) + 3
	hm_df.ix[:, 45:] = 0
	
	data = []
	for gene in hm_df.index:
		datum = {'gene': gene, 'data': []}
		for samp in hm_df.columns:
			datum['data'].append({'sample': samp, 'vaf': hm_df.ix[gene, samp]})
		data.append(datum)
	
	json_str = json.dumps(data, indent=4)
	
	with open('heatmap-data.js', 'w') as f:
		f.write('var hm_data = ' + json_str + ';')
	return


def generate_glyphmap_data():
	ga_df = pd.DataFrame(
		columns=['TCGA-{0:02d}'.format(n) for n in range(50)],
		index=['GENE{0}'.format(n) for n in range(5)])
	
	data = []
	for gene in ga_df.index:
		datum = {
			'gene': gene, 
			'desc': 'Annotation for ' + gene, 
			'data': []
		}
		for samp in ga_df.columns:
			sample = {'sample': samp}
			
			dice_1 = np.random.random()
			if dice_1 < 0.3:
				sample['disp_cna'] = None
				dice_2 = np.random.random()
				if dice_2 < 0.2:
					sample['disp_cna'] = 'amp'
				elif dice_2 < 0.4:
					sample['disp_cna'] = 'homdel'
				elif dice_2 < 0.6:
					sample['disp_cna'] = 'gain'
				elif dice_2 < 0.8:
					sample['disp_cna'] = 'hetloss'
				else:
					sample['disp_cna'] = 'diploid'
			
			dice_1 = np.random.random()
			if dice_1 < 0.3:
				sample['disp_mut'] = None
				dice_2 = np.random.random()
				if dice_2 < 0.25:
					sample['disp_mut'] = 'trunc'
				elif dice_2 < 0.5:
					sample['disp_mut'] = 'inframe'
				elif dice_2 < 0.75:
					sample['disp_mut'] = 'promoter'
				else:
					sample['disp_mut'] = 'missense'
			
			dice_1 = np.random.random()
			if dice_1 < 0.2:
				sample['disp_mrna'] = None
				dice_2 = np.random.random()
				if dice_2 < 0.6:
					sample['disp_mrna'] = 'up'
				else:
					sample['disp_mrna'] = 'down'
			
			dice_1 = np.random.random()
			if dice_1 < 0.2:
				sample['disp_prot'] = None
				dice_2 = np.random.random()
				if dice_2 < 0.6:
					sample['disp_prot'] = 'up'
				else:
					sample['disp_prot'] = 'down'
			
			datum['data'].append(sample)
			
		data.append(datum)
	
	json_str = json.dumps(data, indent=4)
	
	with open('glyphmap-data.js', 'w') as f:
		f.write('var ga_data = ' + json_str + ';')
	return

if __name__ == "__main__":
	np.random.seed(0)
	generate_heatmap_data()
	generate_glyphmap_data()


