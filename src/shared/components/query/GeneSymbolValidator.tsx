import * as _ from 'lodash';
import * as React from 'react';
import queryStore from "./QueryStore";
import * as styles_any from './styles.module.scss';
import {toJS, observable, autorunAsync, reaction, action, computed, whyRun, expr} from "../../../../node_modules/mobx/lib/mobx";
import {observer} from "../../../../node_modules/mobx-react/index";
import {FlexRow, FlexCol} from "../flexbox/FlexBox";
import gene_lists from './gene_lists';
import oql_parser from '../../lib/oql/oql-parser';
import client from "../../api/cbioportalClientInstance";
import {remoteData} from "../../api/remoteData";
import {Gene} from "../../api/CBioPortalAPI";
import Spinner from "react-spinkit";

@observer
export default class GeneSymbolValidator extends React.Component<{}, {}>
{
	get store()
	{
		return queryStore;
	}

	/*
	@observable.ref _genesPromise:Promise<Gene[]>;

	readonly genes = remoteData<Gene[]>(() => this._genesPromise || Promise.resolve([]), []);

	disposeReaction = reaction(() => this.store.geneQuery, _.debounce(() => this.requestGenes(), 500));

	requestGenes()
	{
		let promises:Promise<Gene[]>[] = [];
		let numberCount = this.store.geneIds.filter(id => Number.isInteger(Number(id))).length;
		if (numberCount > 0)
			promises.push(client.fetchGenesUsingPOST({geneIdType: "ENTREZ_GENE_ID", geneIds: this.store.geneIds}));
		if (numberCount < this.store.geneIds.length)
			promises.push(client.fetchGenesUsingPOST({geneIdType: "HUGO_GENE_SYMBOL", geneIds: this.store.geneIds}));

		this._genesPromise = Promise.all(promises).then(results => ([] as Gene[]).concat(...results));
	}

	componentWillUnmount()
	{
		this.disposeReaction();
	}
	*/
/*
	validateGenes = (geneSet:string) =>
	{
		if (!geneSet)
			return;

		let symbolResults = this.store.genes.result;

		$("#genestatus").html("");
		var stateList = $("<ul>").addClass("ui-widget icon-collection validation-list");
		var allValid = true;

		// If the number of genes is more than 100, show an error
		if (symbolResults.length > 100)
		{
			var invalidState = $("<li>").addClass("ui-state-default ui-corner-all");
			var invalidSpan = $("<span>")
				.addClass("ui-icon ui-icon-notice");
			var invalidText = $("<span>").addClass("text");
			invalidText.html("<b>You have entered more than 100 genes.</b>");

			invalidState.attr("title", "Please enter fewer genes for better performance.").tipTip();

			invalidSpan.appendTo(invalidState);
			invalidText.insertAfter(invalidSpan);
			invalidState.addClass("ui-state-active");
			invalidState.prependTo(stateList);

			$("<br>").appendTo(stateList);
			$("<br>").appendTo(stateList);

			stateList.appendTo("#genestatus");

			return;
		}

		for (var j = 0; j < symbolResults.length; j++)
		{
			var aResult = symbolResults[j];
			var multiple = false;
			var foundSynonym = false;
			var valid = true;
			var symbols = [];
			var gene = aResult.name;

			if (aResult.symbols.length == 1)
			{
				multiple = false;
				if (aResult.symbols[0].toUpperCase() != aResult.name.toUpperCase())
				{
					foundSynonym = true;
				}
				else
				{
					continue;
				}
			}
			else if (aResult.symbols.length > 1)
			{
				multiple = true;
				symbols = aResult.symbols;
			}
			else
			{
				allValid = false;
			}

			if (foundSynonym || multiple)
				allValid = false;

			if (multiple)
			{
				var state = $("<li>").addClass("ui-state-default ui-corner-all ui-validator");
				var stateSpan = $("<span>").addClass("ui-icon ui-icon-help");
				var stateText = $("<span>").addClass("text");

				stateText.html(gene + ": ");
				var nameSelect = $("<select>").addClass("geneSelectBox").attr("name", gene);
				$("<option>").attr("value", "")
					.html("select a symbol")
					.appendTo(nameSelect);
				for (var k = 0; k < symbols.length; k++)
				{
					var aSymbol = symbols[k];
					var anOption = $("<option>").attr("value", aSymbol).html(aSymbol);
					anOption.appendTo(nameSelect);
				}
				nameSelect.appendTo(stateText);
				nameSelect.change(function ()
				{
					var trueSymbol = $(this).attr('value');
					var geneName = $(this).attr("name");
					$("#gene_list").val($("#gene_list").val().replace(geneName, trueSymbol));
					setTimeout(validateGenes, 500);
				});

				stateSpan.appendTo(state);
				stateText.insertAfter(stateSpan);
				state.attr("title",
					"Ambiguous gene symbol. Click on one of the alternatives to replace it."
				);
				state.attr("name", gene);
				state.appendTo(stateList);
			}
			else if (foundSynonym)
			{
				var state = $("<li>").addClass("ui-state-default ui-corner-all ui-validator");
				var trueSymbol = aResult.symbols[0];

				state.click(function ()
				{
					$(this).toggleClass('ui-state-active');
					var names = $(this).attr("name").split(":");
					var geneName = names[0];
					var symbol = names[1];
					$("#gene_list").val($("#gene_list").val().replace(geneName, symbol));
					setTimeout(validateGenes, 500);
				});

				var stateSpan = $("<span>").addClass("ui-icon ui-icon-help");
				var stateText = $("<span>").addClass("text");
				stateText.html("<b>" + gene + "</b>: " + trueSymbol);
				stateSpan.appendTo(state);
				stateText.insertAfter(stateSpan);
				state.attr("title",
					"'" + gene + "' is a synonym for '" + trueSymbol + "'. "
					+ "Click here to replace it with the official symbol."
				);
				state.attr("name", gene + ":" + trueSymbol);
				state.appendTo(stateList);
			}
			else
			{
				var state = $("<li>").addClass("ui-state-default ui-corner-all ui-validator");
				state.click(function ()
				{
					$(this).toggleClass('ui-state-active');
					geneName = $(this).attr("name");
					$("#gene_list").val($("#gene_list").val().replace(" " + geneName, ""));
					$("#gene_list").val($("#gene_list").val().replace(geneName + " ", ""));
					$("#gene_list").val($("#gene_list").val().replace(geneName + "\n", ""));
					$("#gene_list").val($("#gene_list").val().replace(geneName, ""));
					setTimeout(validateGenes, 500);
				});
				var stateSpan = $("<span>").addClass("ui-icon ui-icon-circle-close");
				var stateText = $("<span>").addClass("text");
				stateText.html(gene);
				stateSpan.appendTo(state);
				stateText.insertAfter(stateSpan);
				state.attr("title",
					"Could not find gene symbol. Click to remove it from the gene list."
				);
				state.attr("name", gene);
				state.appendTo(stateList);
			}
		}

		stateList.appendTo("#genestatus");

		$('.ui-state-default').hover(
			function ()
			{
				$(this).addClass('ui-state-hover');
			},
			function ()
			{
				$(this).removeClass('ui-state-hover');
			}
		);

		$('.ui-validator').tipTip();

		if (allValid)
		{
			$("#main_submit").removeAttr("disabled")

			if (symbolResults.length > 0
				&& !(symbolResults[0].name == "" && symbolResults[0].symbols.length == 0))
			{

				var validState = $("<li>").addClass("ui-state-default ui-corner-all");
				var validSpan = $("<span>")
					.addClass("ui-icon ui-icon-circle-check");
				var validText = $("<span>").addClass("text");
				validText.html("All gene symbols are valid.");

				validSpan.appendTo(validState);
				validText.insertAfter(validSpan);
				validState.addClass("ui-state-active");
				validState.appendTo(stateList);
				validState.attr("title", "You can now submit the list").tipTip();
				$("<br>").appendTo(stateList);
				$("<br>").appendTo(stateList);
			}

		}
		else
		{
			var invalidState = $("<li>").addClass("ui-state-default ui-corner-all");
			var invalidSpan = $("<span>")
				.addClass("ui-icon ui-icon-notice");
			var invalidText = $("<span>").addClass("text");
			invalidText.html("<b>Invalid gene symbols.</b>");

			invalidState.attr("title", "Please edit the gene symbols").tipTip();

			invalidSpan.appendTo(invalidState);
			invalidText.insertAfter(invalidSpan);
			invalidState.addClass("ui-state-active");
			invalidState.prependTo(stateList);

			$("<br>").appendTo(stateList);
			$("<br>").appendTo(stateList);
		}
	}
*/
	render()
	{
		if (this.store.genes.isPending)
			return (
				<div>
					<Spinner/>
					<small>Validating gene symbols...</small>
				</div>
			);

		for (let result of this.store.oqlParserResult)
			if (result.error)
				return (
					<small>Cannot validate gene symbols because of invalid OQL. Please click 'Submit' to see location of error.</small>
				);

		return (
			<FlexRow>
				<pre>{JSON.stringify(this.store.genes.result, null, 4)}</pre>
			</FlexRow>
		);
	}
}