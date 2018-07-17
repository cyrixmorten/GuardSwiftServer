import * as _ from 'lodash';
import {IHeaderLogo} from "../../../shared/subclass/ReportSettings";


export interface IPdfMakeBuilder {
    header(textLeft, textRight): BasePDFMakeBuilder;
    footer(): BasePDFMakeBuilder;
    content(...args: any[]): BasePDFMakeBuilder;
    generate(...args: any[]): Object;
}


export class BasePDFMakeBuilder implements IPdfMakeBuilder {

    private reportDefinition = {};


    constructor() {
        this.write({
            pageMargins: [40, 60, 40, 60]
        })
    }

    protected write(object: Object) {
        _.assignIn(this.reportDefinition, object);
    }


    // TODO translate
    header(textLeft?, textRight?): BasePDFMakeBuilder {
        this.write({
            header: {
                columns: [
                    {
                        width: 'auto',
                        text: textLeft
                    },
                    {
                        width: '*',
                        text: textRight,
                        alignment: 'right'
                    }
                ],
                margin: [10, 10]
            }
        });

        return this;
    }


    protected headerLogo(headerLogo: IHeaderLogo): Object {
        let result = <any>{};

        if (headerLogo) {
            if (headerLogo.datauri) {
                result = {
                    image: headerLogo.datauri,
                    margin: [20, 60, 20, 0]
                }
            }

            /** defaults **/
            result.alignment = "center";


            if (headerLogo.alignment) {
                result.alignment = headerLogo.alignment;
            }

            if (headerLogo.stretch) {
                // make image take up full width
                result.width = (21 / 2.54) * 72 - (2 * 40); // (cm / 2.54) * dpi - margin
            }
            else {
                if (headerLogo.width) {
                    result.width = headerLogo.width
                }


                if (headerLogo.height) {
                    result.height = headerLogo.height
                }

                // if neither height or width is specified, set width to 3cm
                // from pdfmake: if you specify width, image will scale proportionally
                if (!headerLogo.width && !headerLogo.height) {
                    result.width = (3 / 2.54) * 72;
                }
            }

        }


        return result;
    }


    content(...args: any[]): BasePDFMakeBuilder {
        return this;
    }

    // TODO: Hardcoded, read from reportSettings
    footer(): BasePDFMakeBuilder {
        this.write({
            footer: [
                {text: 'YDERLIGERE OPLYSNINGER PÅ TLF. 86 10 49 50', alignment: 'center'},
                {
                    text: 'Rapporten er genereret af GuardSwift - elektroniske vagtrapporter via smartphones',
                    alignment: 'center'
                }
            ]
        });

        return this;
    }

    styles(): BasePDFMakeBuilder {
        this.write({
            styles: {
                header: {
                    fontSize: 22,
                    bold: true,
                    alignment: 'center'
                },
                subHeader: {
                    fontSize: 16,
                    color: 'grey'
                },
                tableHeader: {
                    bold: true,
                    fontSize: 11,
                    color: 'black'
                },
                boldFont: {
                    bold: true
                }
            }
        });

        return this;
    }

    background(): BasePDFMakeBuilder {
        return this;
    }

    build = (): Object => this.reportDefinition;

    generate(...args: any[]): Object {
        return this.header()
            .background()
            .content()
            .footer()
            .styles()
            .build();
    }

}





